import {
  chmod,
  chown,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Docker from 'dockerode';
import type { HdlSources, SimulationFailure, TruncatedFlags } from '@tplab/shared';
import { env } from '../../config/env.js';
import { VERILOG_TOOLCHAIN, type ArtifactSpec, type Toolchain } from './toolchains.js';

/** `DOCKER_HOST` (`tcp://host:porta` ou `unix:///caminho`) no formato de opcoes do dockerode. */
export function dockerConnectionOptions(host: string | undefined): Docker.DockerOptions {
  if (!host) return {};
  if (host.startsWith('unix://')) return { socketPath: host.slice('unix://'.length) };
  const url = new URL(host.replace(/^tcp:/, 'http:'));
  return { protocol: 'http', host: url.hostname, port: Number(url.port) };
}

const docker = new Docker(dockerConnectionOptions(env.DOCKER_HOST));

/** Raiz dos diretorios de trabalho: `SANDBOX_WORKDIR_ROOT` (VM) ou o tmpdir do SO (desenvolvimento). */
export function workdirRoot(): string {
  return env.SANDBOX_WORKDIR_ROOT ?? tmpdir();
}

/** Rotulo dos containers de simulacao — permite varrer orfaos sem tocar em outros containers do host. */
export const SANDBOX_LABEL = 'tplab.sandbox';

/** Codigos de saida definidos por `infra/sandbox/run-simulation.sh` (contrato de todo script de sandbox). */
export const EXIT_COMPILE_ERROR = 2;
export const EXIT_RUNTIME_ERROR = 3;
export const EXIT_COMPILE_TIMEOUT = 4;
export const EXIT_TIMEOUT = 124;
/** 128 + SIGXFSZ: um arquivo gravado pelo testbench passou do teto por arquivo (RNF04-I03). */
export const EXIT_FILE_SIZE_LIMIT = 153;
export const EXIT_KILLED = 137;

/** Em qual etapa o limite de tempo estourou — `host` = o `killTimer` do worker, nao o script. */
export type TimeoutPhase = 'compile' | 'simulate' | 'host';

export interface SandboxOutcome {
  exitCode: number;
  failure: SimulationFailure | null;
  stdout: string;
  stderr: string;
  /** RNF08-I01 — artefatos declarados pela toolchain que o container gerou, por nome. */
  artifacts: Record<string, string>;
  /** Derivado de `artifacts.vcd`, mantido para os consumidores atuais. */
  vcd: string | null;
  durationMs: number;
  timings: SandboxTimings;
  /** RF04-I02 — quais dos tres artefatos acima vieram cortados por teto de tamanho. */
  truncated: TruncatedFlags;
  /** RNF05-I01 — `State.OOMKilled` do container: o dado autoritativo de estouro de memoria. */
  oomKilled: boolean;
  /** RNF05-I01 — etapa que estourou o tempo, ou `null` quando nao houve timeout. */
  timeoutPhase: TimeoutPhase | null;
  /** RNF05-I02 — o Docker recusou `logs` mesmo apos novas tentativas: stdout/stderr vieram vazios por falha, nao por silencio do codigo. */
  logsUnavailable: boolean;
}

/**
 * Tempos parciais dentro de `durationMs` (RF03-I04) — separam o overhead do
 * Docker (criacao do container) da execucao de verdade (`iverilog`/`vvp`) e
 * da leitura dos artefatos, para investigar RNF07-I02 sem adivinhar onde o
 * tempo foi gasto. Somados, ficam perto de `durationMs` (a diferenca e o
 * tempo gasto escrevendo os fontes no tmpdir e removendo o container/workdir).
 */
export interface SandboxTimings {
  containerCreateMs: number;
  executionMs: number;
  artifactsReadMs: number;
  /** RNF07-I01 — `iverilog` e `vvp` separados (marca `@@tplab-timing` do script); `null` se a etapa nao terminou. */
  compileMs: number | null;
  simulateMs: number | null;
}

const TIMING_LINE = /^@@tplab-timing((?: (?:compile|simulate)_ms=\d+)*)[ \t]*\r?$\n?/gm;

/**
 * Tira de stderr as linhas `@@tplab-timing` que o script emite (RNF07-I01) e devolve os tempos.
 * Vale a ULTIMA marca: o codigo do usuario alcanca stderr (`$fdisplay(2, ...)`) e poderia forjar
 * uma — o que so distorceria as metricas do proprio job, e nunca aparece ao usuario.
 */
export function extractStageTimings(stderr: string): {
  stderr: string;
  compileMs: number | null;
  simulateMs: number | null;
} {
  let compileMs: number | null = null;
  let simulateMs: number | null = null;
  const cleaned = stderr.replace(TIMING_LINE, (_line, fields: string) => {
    const compile = /compile_ms=(\d+)/.exec(fields);
    const simulate = /simulate_ms=(\d+)/.exec(fields);
    compileMs = compile ? Number(compile[1]) : null;
    simulateMs = simulate ? Number(simulate[1]) : null;
    return '';
  });
  return { stderr: cleaned, compileMs, simulateMs };
}

export interface SandboxLimits {
  image: string;
  timeoutMs: number;
  /** Teto da compilacao (`iverilog`), separado do da simulacao. */
  compileTimeoutMs: number;
  memoryMb: number;
  cpus: number;
}

/**
 * Todas as barreiras de RNF04/RNF05 num lugar so, sem tocar no Docker: e o que
 * `sandbox.security.test.ts` confere chave a chave, para que remover ou errar o
 * nome de uma opcao (o Docker ignora chave desconhecida em silencio) reprove o
 * teste em vez de desligar uma protecao sem ninguem perceber.
 */
export function buildSandboxContainerOptions(
  workdir: string,
  limits: SandboxLimits = defaultSandboxLimits(),
): Docker.ContainerCreateOptions {
  return {
    Image: limits.image,
    WorkingDir: '/work',
    User: 'sandbox',
    // So os dois tetos de tempo: nada da API (DATABASE_URL, segredos) chega ao container.
    Env: [
      `SIM_TIMEOUT_S=${Math.ceil(limits.timeoutMs / 1000)}`,
      `SIM_COMPILE_TIMEOUT_S=${Math.ceil(limits.compileTimeoutMs / 1000)}`,
    ],
    Labels: { [SANDBOX_LABEL]: 'true' },
    NetworkDisabled: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    HostConfig: {
      AutoRemove: false, // removido explicitamente apos a leitura dos logs
      NetworkMode: 'none',
      Binds: [`${workdir}:/work:rw`],
      ReadonlyRootfs: true,
      Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=32m' },
      Memory: limits.memoryMb * 1024 * 1024,
      MemorySwap: limits.memoryMb * 1024 * 1024, // sem swap
      NanoCpus: Math.round(limits.cpus * 1e9),
      PidsLimit: 128,
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      // RNF04-I03 — o log do container vive no disco do host e nao tem teto: um $display
      // em laco gera GBs em 10 s, e o docker-modem estoura ao montar a string (
      // ERR_STRING_TOO_LONG). Rotaciona em 1 MiB x 2 arquivos: sobram sempre as ultimas
      // linhas — as que interessam, ja que stdout/stderr cortam pelo fim (RF04-I02).
      LogConfig: { Type: 'json-file', Config: { 'max-size': '1m', 'max-file': '2' } },
    },
  };
}

/**
 * Remove containers de simulacao que sobraram de um worker morto no meio de uma
 * execucao (o `finally` de `runInSandbox` nao roda se o processo for encerrado
 * a forca). So mexe em containers com o rotulo do sandbox: parados (qualquer
 * idade) ou em execucao ha mais que o teto do job, que ja nao tem dono vivo.
 * Devolve quantos removeu.
 */
export async function removeOrphanSandboxContainers(): Promise<number> {
  const maxAgeSeconds = Math.ceil((env.SANDBOX_TIMEOUT_MS + 5_000) / 1000) + 10;
  const nowSeconds = Math.floor(Date.now() / 1000);

  const containers = await docker.listContainers({
    all: true,
    filters: { label: [`${SANDBOX_LABEL}=true`] },
  });

  let removed = 0;
  for (const info of containers) {
    const stale = info.State !== 'running' || nowSeconds - info.Created > maxAgeSeconds;
    if (!stale) continue;
    await docker
      .getContainer(info.Id)
      .remove({ force: true })
      .then(() => {
        removed += 1;
      })
      .catch(() => undefined);
  }
  return removed;
}

/**
 * `MemorySwap = Memory` (sem swap) so e aplicado se o kernel/Docker tem contabilidade de swap
 * (`docker info`: SwapLimit). Sem ela — o caso do WSL2 com particao de swap — o processo que
 * estoura a memoria e paginado em vez de morto: o OOM demora minutos (ou nunca vem) e o
 * limite de memoria deixa de proteger a maquina. Verificado na maquina de desenvolvimento
 * (SwapLimit=false: um estouro de 32 MB levou 166 s para ser morto).
 */
export async function dockerSupportsSwapLimit(): Promise<boolean> {
  const info = (await docker.info()) as { SwapLimit?: boolean };
  return info.SwapLimit === true;
}

const WORKDIR_PREFIX = 'hdl-sim-';

/** uid do usuario `sandbox` — fixado em `infra/sandbox/Dockerfile` (`adduser -u 10001`); mudar um exige mudar o outro. */
const SANDBOX_UID = 10001;

/**
 * O workdir e criado pelo worker (`mkdtemp` => modo 0700, dono = quem roda o worker), mas
 * quem le os fontes e grava o `.vcd` dentro do container e o uid do `sandbox`. Num worker
 * com privilegio (container como root, o caso da VM) o dono passa a ser o `sandbox` — so ele
 * e o worker alcancam o diretorio (0755, sem escrita para terceiros). Sem privilegio para
 * trocar o dono (dev fora de container), cai para 0777: o diretorio e efemero e o pai
 * (`hdl-sim-*`) tem nome aleatorio, mas e o custo de nao exigir root em desenvolvimento.
 */
export async function prepareWorkdir(workdir: string): Promise<'owner' | 'open'> {
  try {
    await chown(workdir, SANDBOX_UID, SANDBOX_UID);
    await chmod(workdir, 0o755);
    return 'owner';
  } catch {
    await chmod(workdir, 0o777);
    return 'open';
  }
}

/** Igual ao de containers: diretorio temporario de um worker morto fica para tras, com os fontes do usuario. */
export async function removeOrphanWorkdirs(
  maxAgeMs: number = env.SANDBOX_TIMEOUT_MS + 60_000,
  root: string = workdirRoot(),
): Promise<number> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);

  let removed = 0;
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(WORKDIR_PREFIX)) continue;
    const path = join(root, entry.name);
    const info = await stat(path).catch(() => null);
    if (!info || Date.now() - info.mtimeMs < maxAgeMs) continue;
    await rm(path, { recursive: true, force: true })
      .then(() => {
        removed += 1;
      })
      .catch(() => undefined);
  }
  return removed;
}

/**
 * Executa uma submissao em um container Docker efemero, sem rede, com limites de
 * CPU/memoria e timeout (RNF04/RNF05). Nunca invocar `iverilog`/`vvp` fora daqui.
 */
export async function runInSandbox(
  sources: HdlSources,
  limits: SandboxLimits = defaultSandboxLimits(),
  toolchain: Toolchain = VERILOG_TOOLCHAIN,
): Promise<SandboxOutcome> {
  const workdir = await mkdtemp(join(workdirRoot(), WORKDIR_PREFIX));
  const startedAt = Date.now();

  try {
    await prepareWorkdir(workdir);
    await writeFile(join(workdir, sources.design.name), sources.design.content, 'utf8');
    await writeFile(join(workdir, sources.testbench.name), sources.testbench.content, 'utf8');

    const containerCreateStartedAt = Date.now();
    const container = await docker.createContainer(buildSandboxContainerOptions(workdir, limits));

    const containerCreateMs = Date.now() - containerCreateStartedAt;

    let timedOut = false;
    try {
      const executionStartedAt = Date.now();
      await container.start();

      // Rede de seguranca sobre os dois timeouts internos do script (compilacao +
      // simulacao) — so dispara se o script em si travar. Quando dispara, e um
      // sinal de que o timeout interno parou de funcionar e precisa aparecer no log.
      const killTimer = setTimeout(
        () => {
          timedOut = true;
          void container.kill().catch(() => undefined);
        },
        limits.compileTimeoutMs + limits.timeoutMs + 5_000,
      );

      let exitCode: number;
      try {
        const result = (await container.wait()) as { StatusCode: number };
        exitCode = result.StatusCode;
      } finally {
        clearTimeout(killTimer);
      }
      const executionMs = Date.now() - executionStartedAt;

      const artifactsReadStartedAt = Date.now();
      // O Docker responde 409 "dead or marked for removal" a `logs` as vezes logo apos o
      // container sair (visto com o PID 1 morto por OOM e, na maquina de desenvolvimento, ate em
      // execucao normal — 1 vez em ~140). Repete algumas vezes antes de desistir; se nao vier,
      // o resultado nao pode ser dado como sucesso silencioso com saida vazia.
      const logs = await readContainerLogs(
        () =>
          container.logs({
            stdout: true,
            stderr: true,
            follow: false,
          }) as unknown as Promise<Buffer>,
      );
      const { stdout, stderr } = demuxDockerLogs(logs ?? Buffer.alloc(0));
      const stdoutResult = truncateFromEnd(stdout, env.MAX_STDOUT_BYTES);
      const stages = extractStageTimings(stderr);
      const stderrResult = truncateFromEnd(stages.stderr, env.MAX_STDERR_BYTES);
      const artifactResults = await readArtifacts(workdir, toolchain.artifacts);
      const artifactsReadMs = Date.now() - artifactsReadStartedAt;
      const oomKilled = await container
        .inspect()
        .then((info) => info.State?.OOMKilled === true)
        .catch(() => false);

      const logsUnavailable = logs === null;
      const mapped = mapFailure(timedOut ? EXIT_TIMEOUT : exitCode, { oomKilled });

      return {
        exitCode,
        // Sem logs nao ha como saber se a saida estava correta: nunca sucesso silencioso.
        failure: mapped === null && logsUnavailable ? 'internal_error' : mapped,
        oomKilled,
        logsUnavailable,
        timeoutPhase: timeoutPhaseOf(timedOut ? EXIT_TIMEOUT : exitCode, timedOut),
        stdout: stdoutResult.text,
        stderr: stderrResult.text,
        artifacts: Object.fromEntries(
          Object.entries(artifactResults).flatMap(([name, result]) =>
            result.text === null ? [] : [[name, result.text]],
          ),
        ),
        vcd: artifactResults.vcd?.text ?? null,
        durationMs: Date.now() - startedAt,
        timings: {
          containerCreateMs,
          executionMs,
          artifactsReadMs,
          compileMs: stages.compileMs,
          simulateMs: stages.simulateMs,
        },
        truncated: {
          stdout: stdoutResult.truncated,
          stderr: stderrResult.truncated,
          vcd: artifactResults.vcd?.truncated ?? false,
        },
      };
    } finally {
      await container.remove({ force: true }).catch(() => undefined);
    }
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Le os logs do container com algumas tentativas; `null` quando o Docker segue recusando. */
export async function readContainerLogs(
  read: () => Promise<Buffer>,
  attempts = 4,
  delayMs = 250,
): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await read();
    } catch {
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

export function defaultSandboxLimits(toolchain: Toolchain = VERILOG_TOOLCHAIN): SandboxLimits {
  return {
    image: toolchain.image(),
    timeoutMs: env.SANDBOX_TIMEOUT_MS,
    compileTimeoutMs: env.SANDBOX_COMPILE_TIMEOUT_MS,
    memoryMb: env.SANDBOX_MEMORY_MB,
    cpus: env.SANDBOX_CPUS,
  };
}

/**
 * Traduz o desfecho do container em `SimulationFailure` (RNF05-I01). Memoria e
 * decidida pelo `OOMKilled` do Docker — o dado autoritativo — e nao pelo codigo
 * de saida: 137 e o de qualquer SIGKILL, inclusive o do proprio `timeout`. Um 137
 * sem `OOMKilled` e um processo morto por outra causa, nao estouro de memoria,
 * e vira `internal_error` em vez de acusar o usuario de algo que ele nao fez.
 */
export function mapFailure(
  exitCode: number,
  { oomKilled }: { oomKilled: boolean },
): SimulationFailure | null {
  if (oomKilled) return 'memory_limit';
  switch (exitCode) {
    case 0:
      return null;
    case EXIT_COMPILE_ERROR:
      return 'compile_error';
    case EXIT_RUNTIME_ERROR:
    case EXIT_FILE_SIZE_LIMIT:
      return 'runtime_error';
    case EXIT_COMPILE_TIMEOUT:
    case EXIT_TIMEOUT:
      return 'timeout';
    default:
      // Inclui 137 sem OOMKilled e qualquer codigo que o script nao define.
      return 'internal_error';
  }
}

/** Etapa do timeout: 4 = compilacao, 124 = simulacao, e `host` quando foi o `killTimer`. */
export function timeoutPhaseOf(exitCode: number, killedByHost: boolean): TimeoutPhase | null {
  if (killedByHost) return 'host';
  if (exitCode === EXIT_COMPILE_TIMEOUT) return 'compile';
  if (exitCode === EXIT_TIMEOUT) return 'simulate';
  return null;
}

export interface TruncationResult {
  text: string;
  truncated: boolean;
}

/**
 * Le cada artefato declarado pela toolchain, com o teto de tamanho dele (RF04-I02). `text` e
 * `null` quando o arquivo nao existe ou nao e legivel.
 */
export async function readArtifacts(
  workdir: string,
  specs: readonly ArtifactSpec[],
): Promise<Record<string, { text: string | null; truncated: boolean }>> {
  const entries = await readdir(workdir).catch(() => [] as string[]);
  const results: Record<string, { text: string | null; truncated: boolean }> = {};
  for (const spec of specs) {
    results[spec.name] = await readArtifact(workdir, entries, spec);
  }
  return results;
}

async function readArtifact(
  workdir: string,
  entries: readonly string[],
  spec: ArtifactSpec,
): Promise<{ text: string | null; truncated: boolean }> {
  const fileName = entries.find((entry) => spec.filePattern.test(entry));
  if (!fileName) return { text: null, truncated: false };

  // So arquivo regular: o workdir e gravavel pelo codigo do usuario, e um link simbolico
  // (que o Verilog nao consegue criar, mas custa uma linha garantir) faria o worker ler
  // um arquivo do host no lugar do artefato.
  const info = await lstat(join(workdir, fileName)).catch(() => null);
  if (!info?.isFile()) return { text: null, truncated: false };

  const content = await readFile(join(workdir, fileName), 'utf8').catch(() => null);
  if (content === null) return { text: null, truncated: false };

  return truncateAtLineBoundary(content, spec.maxBytes());
}

/**
 * Corta no ultimo `\n` dentro do limite, nunca no meio de uma linha — o
 * cabecalho `$var` (inicio do arquivo) e obrigatorio para interpretar os
 * valores, e o parser de RF06 le o .vcd linha a linha; ja tolera um corte
 * assim (marca `truncated: true` e para no ultimo registro completo), mas uma
 * linha pela metade no meio de um token multi-byte quebraria a leitura do
 * arquivo inteiro.
 */
export function truncateAtLineBoundary(content: string, maxBytes: number): TruncationResult {
  if (content.length <= maxBytes) return { text: content, truncated: false };
  const lastNewline = content.lastIndexOf('\n', maxBytes);
  const text = lastNewline === -1 ? content.slice(0, maxBytes) : content.slice(0, lastNewline + 1);
  return { text, truncated: true };
}

/**
 * Corta stdout/stderr pelo fim (RF04-I02): as ultimas linhas costumam ser as
 * informativas quando ha erro, ao contrario do `.vcd` (onde o cabecalho no
 * inicio e obrigatorio). Recua ate a proxima quebra de linha para nao entregar
 * o inicio do texto cortado no meio de uma linha.
 */
export function truncateFromEnd(text: string, maxBytes: number): TruncationResult {
  if (text.length <= maxBytes) return { text, truncated: false };

  const discardedBytes = text.length - maxBytes;
  const rawKept = text.slice(discardedBytes);
  const firstNewline = rawKept.indexOf('\n');
  const kept = firstNewline === -1 ? rawKept : rawKept.slice(firstNewline + 1);

  return {
    text: `[${discardedBytes} bytes descartados do inicio]\n${kept}`,
    truncated: true,
  };
}

/**
 * Sem TTY o Docker multiplexa stdout/stderr em frames de 8 bytes de cabecalho:
 * [stream(1)][0,0,0][tamanho big-endian(4)].
 */
export function demuxDockerLogs(buffer: Buffer): { stdout: string; stderr: string } {
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];

  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const streamType = buffer.readUInt8(offset);
    const length = buffer.readUInt32BE(offset + 4);
    const start = offset + 8;
    const end = Math.min(start + length, buffer.length);
    const chunk = buffer.subarray(start, end);

    if (streamType === 2) stderr.push(chunk);
    else stdout.push(chunk);

    offset = end;
  }

  return {
    stdout: Buffer.concat(stdout).toString('utf8'),
    stderr: Buffer.concat(stderr).toString('utf8'),
  };
}

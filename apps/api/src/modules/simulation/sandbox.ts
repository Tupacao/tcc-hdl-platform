import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Docker from 'dockerode';
import type { HdlSources, SimulationFailure, TruncatedFlags } from '@tplab/shared';
import { env } from '../../config/env.js';

const docker = new Docker();

/** Rotulo dos containers de simulacao — permite varrer orfaos sem tocar em outros containers do host. */
export const SANDBOX_LABEL = 'tplab.sandbox';

/** Codigos de saida definidos por `infra/sandbox/run-simulation.sh`. */
const EXIT_COMPILE_ERROR = 2;
const EXIT_RUNTIME_ERROR = 3;
const EXIT_TIMEOUT = 124;
const EXIT_KILLED = 137;

export interface SandboxOutcome {
  exitCode: number;
  failure: SimulationFailure | null;
  stdout: string;
  stderr: string;
  vcd: string | null;
  durationMs: number;
  timings: SandboxTimings;
  /** RF04-I02 — quais dos tres artefatos acima vieram cortados por teto de tamanho. */
  truncated: TruncatedFlags;
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
}

export interface SandboxLimits {
  image: string;
  timeoutMs: number;
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
  limits: SandboxLimits = {
    image: env.SANDBOX_IMAGE,
    timeoutMs: env.SANDBOX_TIMEOUT_MS,
    memoryMb: env.SANDBOX_MEMORY_MB,
    cpus: env.SANDBOX_CPUS,
  },
): Docker.ContainerCreateOptions {
  return {
    Image: limits.image,
    WorkingDir: '/work',
    User: 'sandbox',
    // Unica variavel de ambiente do container: nada da API (DATABASE_URL, segredos) chega la.
    Env: [`SIM_TIMEOUT_S=${Math.ceil(limits.timeoutMs / 1000)}`],
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

const WORKDIR_PREFIX = 'hdl-sim-';

/** Igual ao de containers: diretorio temporario de um worker morto fica para tras, com os fontes do usuario. */
export async function removeOrphanWorkdirs(
  maxAgeMs: number = env.SANDBOX_TIMEOUT_MS + 60_000,
  root: string = tmpdir(),
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
export async function runInSandbox(sources: HdlSources): Promise<SandboxOutcome> {
  const workdir = await mkdtemp(join(tmpdir(), WORKDIR_PREFIX));
  const startedAt = Date.now();

  try {
    await writeFile(join(workdir, sources.design.name), sources.design.content, 'utf8');
    await writeFile(join(workdir, sources.testbench.name), sources.testbench.content, 'utf8');

    const containerCreateStartedAt = Date.now();
    const container = await docker.createContainer(buildSandboxContainerOptions(workdir));

    const containerCreateMs = Date.now() - containerCreateStartedAt;

    let timedOut = false;
    try {
      const executionStartedAt = Date.now();
      await container.start();

      // Margem sobre o timeout interno do script, que ja mata o `vvp`.
      const killTimer = setTimeout(() => {
        timedOut = true;
        void container.kill().catch(() => undefined);
      }, env.SANDBOX_TIMEOUT_MS + 5_000);

      let exitCode: number;
      try {
        const result = (await container.wait()) as { StatusCode: number };
        exitCode = result.StatusCode;
      } finally {
        clearTimeout(killTimer);
      }
      const executionMs = Date.now() - executionStartedAt;

      const artifactsReadStartedAt = Date.now();
      const logs = await container.logs({ stdout: true, stderr: true, follow: false });
      const { stdout, stderr } = demuxDockerLogs(logs as unknown as Buffer);
      const stdoutResult = truncateFromEnd(stdout, env.MAX_STDOUT_BYTES);
      const stderrResult = truncateFromEnd(stderr, env.MAX_STDERR_BYTES);
      const vcdResult = await readVcd(workdir);
      const artifactsReadMs = Date.now() - artifactsReadStartedAt;

      return {
        exitCode,
        failure: mapFailure(timedOut ? EXIT_TIMEOUT : exitCode),
        stdout: stdoutResult.text,
        stderr: stderrResult.text,
        vcd: vcdResult.text,
        durationMs: Date.now() - startedAt,
        timings: { containerCreateMs, executionMs, artifactsReadMs },
        truncated: {
          stdout: stdoutResult.truncated,
          stderr: stderrResult.truncated,
          vcd: vcdResult.truncated,
        },
      };
    } finally {
      await container.remove({ force: true }).catch(() => undefined);
    }
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function mapFailure(exitCode: number): SimulationFailure | null {
  switch (exitCode) {
    case 0:
      return null;
    case EXIT_COMPILE_ERROR:
      return 'compile_error';
    case EXIT_RUNTIME_ERROR:
      return 'runtime_error';
    case EXIT_TIMEOUT:
      return 'timeout';
    case EXIT_KILLED:
      return 'memory_limit';
    default:
      return 'internal_error';
  }
}

export interface TruncationResult {
  text: string;
  truncated: boolean;
}

async function readVcd(workdir: string): Promise<{ text: string | null; truncated: boolean }> {
  const entries = await readdir(workdir).catch(() => [] as string[]);
  const vcdName = entries.find((entry) => entry.endsWith('.vcd'));
  if (!vcdName) return { text: null, truncated: false };

  const content = await readFile(join(workdir, vcdName), 'utf8').catch(() => null);
  if (content === null) return { text: null, truncated: false };

  return truncateAtLineBoundary(content, env.MAX_VCD_BYTES);
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

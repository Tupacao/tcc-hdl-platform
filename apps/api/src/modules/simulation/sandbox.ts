import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Docker from 'dockerode';
import type { HdlSources, SimulationFailure } from '@tplab/shared';
import { env } from '../../config/env.js';

const docker = new Docker();

/**
 * Teto do .vcd devolvido ao navegador (RF03-I03). Cada job retido no Redis
 * carrega esse conteudo inteiro em `returnvalue` — 500 jobs no limite antigo de
 * 8 MB seriam 4 GB, mais que a memoria da VM B2s de producao. 2 MB cobre com
 * folga os exemplos de `apps/web/src/lib/samples.ts`.
 */
const MAX_VCD_BYTES = 2 * 1024 * 1024;

/** Teto de stdout/stderr retidos por job (RF03-I03), pelo mesmo motivo do .vcd. */
const MAX_OUTPUT_BYTES = 256 * 1024;

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
}

/**
 * Executa uma submissao em um container Docker efemero, sem rede, com limites de
 * CPU/memoria e timeout (RNF04/RNF05). Nunca invocar `iverilog`/`vvp` fora daqui.
 */
export async function runInSandbox(sources: HdlSources): Promise<SandboxOutcome> {
  const workdir = await mkdtemp(join(tmpdir(), 'hdl-sim-'));
  const startedAt = Date.now();

  try {
    await writeFile(join(workdir, sources.design.name), sources.design.content, 'utf8');
    await writeFile(join(workdir, sources.testbench.name), sources.testbench.content, 'utf8');

    const container = await docker.createContainer({
      Image: env.SANDBOX_IMAGE,
      WorkingDir: '/work',
      User: 'sandbox',
      Env: [`SIM_TIMEOUT_S=${Math.ceil(env.SANDBOX_TIMEOUT_MS / 1000)}`],
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
        Memory: env.SANDBOX_MEMORY_MB * 1024 * 1024,
        MemorySwap: env.SANDBOX_MEMORY_MB * 1024 * 1024, // sem swap
        NanoCpus: Math.round(env.SANDBOX_CPUS * 1e9),
        PidsLimit: 128,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
      },
    });

    let timedOut = false;
    try {
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

      const logs = await container.logs({ stdout: true, stderr: true, follow: false });
      const { stdout, stderr } = demuxDockerLogs(logs as unknown as Buffer);
      const vcd = await readVcd(workdir);

      return {
        exitCode,
        failure: mapFailure(timedOut ? EXIT_TIMEOUT : exitCode),
        stdout: truncateOutput(stdout),
        stderr: truncateOutput(stderr),
        vcd,
        durationMs: Date.now() - startedAt,
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

async function readVcd(workdir: string): Promise<string | null> {
  const entries = await readdir(workdir).catch(() => [] as string[]);
  const vcdName = entries.find((entry) => entry.endsWith('.vcd'));
  if (!vcdName) return null;

  const content = await readFile(join(workdir, vcdName), 'utf8').catch(() => null);
  if (content === null) return null;

  return truncateAtLineBoundary(content, MAX_VCD_BYTES);
}

/**
 * Corta no ultimo `\n` dentro do limite, nunca no meio de uma linha — o parser
 * de RF06 le o .vcd linha a linha e ja tolera um corte assim (marca
 * `truncated: true` e para no ultimo registro completo), mas uma linha pela
 * metade no meio de um token multi-byte quebraria a leitura do arquivo inteiro.
 */
export function truncateAtLineBoundary(content: string, maxBytes: number): string {
  if (content.length <= maxBytes) return content;
  const lastNewline = content.lastIndexOf('\n', maxBytes);
  return lastNewline === -1 ? content.slice(0, maxBytes) : content.slice(0, lastNewline + 1);
}

/** Trunca stdout/stderr retidos (RF03-I03), com um aviso explicito no corte. */
export function truncateOutput(text: string, maxBytes = MAX_OUTPUT_BYTES): string {
  if (text.length <= maxBytes) return text;
  return `${text.slice(0, maxBytes)}\n[saida truncada em ${Math.round(maxBytes / 1024)} KB]`;
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

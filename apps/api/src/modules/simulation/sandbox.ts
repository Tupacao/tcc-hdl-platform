import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Docker from 'dockerode';
import type { HdlSources, SimulationFailure } from '@tplab/shared';
import { env } from '../../config/env.js';

const docker = new Docker();

/** Teto do .vcd devolvido ao navegador — evita estourar a memoria do visualizador. */
const MAX_VCD_BYTES = 8 * 1024 * 1024;

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
        stdout,
        stderr,
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

  return content.length > MAX_VCD_BYTES ? content.slice(0, MAX_VCD_BYTES) : content;
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

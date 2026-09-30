import { Worker } from 'bullmq';
import type { SimulationResult } from '@tplab/shared';
import { createRedisConnection } from './lib/redis.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { recordJobOutcome } from './lib/metrics.js';
import {
  SIMULATION_QUEUE,
  type SimulationJobData,
  type SimulationJobResult,
} from './modules/simulation/queue.js';
import { parseIcarusDiagnostics } from './modules/simulation/diagnostics.js';
import { attachHints } from './modules/simulation/hints.js';
import { buildJobLogRecord } from './modules/simulation/job-log.js';
import { analyzeLimitFailure, dropShellNoise } from './modules/simulation/limits.js';
import {
  removeOrphanSandboxContainers,
  dockerSupportsSwapLimit,
  removeOrphanWorkdirs,
  runInSandbox,
} from './modules/simulation/sandbox.js';
import { analyzePostExecution, analyzeTestbenchContract } from './modules/simulation/testbench.js';
import { analyzeToolchainVectors } from './modules/simulation/vectors.js';

/** Conexao separada da do BullMQ (RF03-I04) — so para os contadores em `lib/metrics.ts`. */
const metricsConnection = createRedisConnection();

/**
 * Consumidor da fila: cada job vira um container efemero. Rodar como processo
 * separado mantem a API responsiva durante compilacoes longas (RNF07).
 */
const worker = new Worker<SimulationJobData, SimulationJobResult>(
  SIMULATION_QUEUE,
  async (job): Promise<SimulationJobResult> => {
    const outcome = await runInSandbox(job.data);

    // RF04-I01: contrato do testbench (topModule coerente, $dumpfile/$dumpvars
    // presentes) — heuristica, nunca bloqueia; vira `warning` no mesmo console
    // dos diagnosticos do iverilog, sem componente novo no frontend.
    const contract = analyzeTestbenchContract(
      job.data.design,
      job.data.testbench,
      job.data.topModule,
    );
    const postExecutionWarnings = analyzePostExecution({
      testbenchName: job.data.testbench.name,
      topModule: job.data.topModule,
      failure: outcome.failure,
      stdout: outcome.stdout,
      vcd: outcome.vcd,
      alreadyWarnedMissingDump: contract.missingDumpDirectives,
    });

    // RNF05: limite atingido vira erro com causa provavel e proximo passo.
    const limitDiagnostics = analyzeLimitFailure({
      failure: outcome.failure,
      timeoutPhase: outcome.timeoutPhase,
      exitCode: outcome.exitCode,
      logsUnavailable: outcome.logsUnavailable,
      testbenchName: job.data.testbench.name,
      timeoutMs: env.SANDBOX_TIMEOUT_MS,
      compileTimeoutMs: env.SANDBOX_COMPILE_TIMEOUT_MS,
      memoryMb: env.SANDBOX_MEMORY_MB,
    });
    if (outcome.timeoutPhase === 'host') {
      // O timeout interno do script deveria ter agido antes: se o `killTimer` do host
      // foi quem matou, o limite de dentro do container parou de funcionar.
      logger.warn(
        { jobId: String(job.id) },
        'killTimer do host encerrou o job — timeout interno falhou',
      );
    }

    const diagnostics = [
      ...contract.diagnostics,
      // RNF04-I03: construcoes que tocam o sistema de arquivos/SO — aviso, nunca bloqueio.
      ...analyzeToolchainVectors([job.data.design, job.data.testbench]),
      ...limitDiagnostics,
      ...dropShellNoise(
        attachHints(
          parseIcarusDiagnostics(outcome.stderr, [job.data.design.name, job.data.testbench.name]),
        ),
        limitDiagnostics,
      ),
      ...postExecutionWarnings,
    ];

    logger.info(
      buildJobLogRecord({
        jobId: String(job.id),
        sources: job.data,
        outcome,
        queuedAt: job.timestamp,
        processedAt: job.processedOn,
      }),
      'job de simulacao concluido',
    );
    await recordJobOutcome(metricsConnection, outcome).catch((cause: unknown) => {
      logger.warn({ err: cause }, 'falha ao gravar metricas do worker no Redis');
    });

    return {
      failure: outcome.failure,
      diagnostics,
      stdout: outcome.stdout,
      stderr: outcome.stderr,
      vcd: outcome.vcd,
      durationMs: outcome.durationMs,
      finishedAt: new Date().toISOString(),
      // O job terminou de processar — por definicao nao esta mais na fila (RF03-I02).
      queuePosition: null,
      truncated: outcome.truncated,
      timings: {
        queueWaitMs: job.processedOn !== undefined ? job.processedOn - job.timestamp : null,
        containerCreateMs: outcome.timings.containerCreateMs,
        compileMs: outcome.timings.compileMs,
        simulateMs: outcome.timings.simulateMs,
        executionMs: outcome.timings.executionMs,
        artifactsReadMs: outcome.timings.artifactsReadMs,
      },
    } satisfies Omit<SimulationResult, 'jobId' | 'status'>;
  },
  {
    connection: createRedisConnection(),
    // Cada job consome CPU/memoria do host; manter baixo na VM B2s.
    concurrency: 2,
  },
);

worker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id ?? null, err: error }, 'job falhou antes de produzir um resultado');
});

// Sem listener aqui, um erro de conexao (Redis fora do ar) sobe como excecao
// nao tratada e derruba o processo inteiro - o mesmo cuidado que `redis.ts` ja
// tem do lado da API, so que o Worker precisa da conexao ativa para consumir a
// fila, entao o erro aparece de verdade (aqui, nao so ao enfileirar um job).
worker.on('error', (error) => {
  logger.error({ err: error }, 'erro de conexao com o Redis');
});

/**
 * RNF04-I01 — o `finally` de `runInSandbox` nao roda se o worker for morto a
 * forca (OOM do host, `kill -9`, queda da VM): sobram um container e o diretorio
 * com os fontes do usuario. Varre no start e de tempos em tempos.
 */
async function sweepOrphans(): Promise<void> {
  const containers = await removeOrphanSandboxContainers().catch((cause: unknown) => {
    logger.warn({ err: cause }, 'falha ao varrer containers orfaos do sandbox');
    return 0;
  });
  const workdirs = await removeOrphanWorkdirs().catch(() => 0);
  if (containers > 0 || workdirs > 0) {
    logger.warn({ containers, workdirs }, 'orfaos de um worker anterior removidos');
  }
}

void dockerSupportsSwapLimit()
  .then((supported) => {
    if (!supported) {
      logger.warn(
        'Docker sem limite de swap (SwapLimit=false): MemorySwap nao e aplicado e um estouro de memoria pagina em vez de ser morto — o limite de memoria (RNF05) nao protege a maquina',
      );
    }
  })
  .catch(() => undefined);

const ORPHAN_SWEEP_INTERVAL_MS = 5 * 60_000;
void sweepOrphans();
setInterval(() => void sweepOrphans(), ORPHAN_SWEEP_INTERVAL_MS).unref();

logger.info({ image: env.SANDBOX_IMAGE }, `escutando a fila "${SIMULATION_QUEUE}"`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void worker.close().then(() => process.exit(0));
  });
}

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
import { runInSandbox } from './modules/simulation/sandbox.js';

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
    const diagnostics = attachHints(
      parseIcarusDiagnostics(outcome.stderr, [job.data.design.name, job.data.testbench.name]),
    );

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

logger.info({ image: env.SANDBOX_IMAGE }, `escutando a fila "${SIMULATION_QUEUE}"`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void worker.close().then(() => process.exit(0));
  });
}

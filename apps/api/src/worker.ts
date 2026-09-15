import { Worker } from 'bullmq';
import type { SimulationResult } from '@tplab/shared';
import { createRedisConnection } from './lib/redis.js';
import { env } from './config/env.js';
import {
  SIMULATION_QUEUE,
  type SimulationJobData,
  type SimulationJobResult,
} from './modules/simulation/queue.js';
import { parseIcarusDiagnostics } from './modules/simulation/diagnostics.js';
import { runInSandbox } from './modules/simulation/sandbox.js';

/**
 * Consumidor da fila: cada job vira um container efemero. Rodar como processo
 * separado mantem a API responsiva durante compilacoes longas (RNF07).
 */
const worker = new Worker<SimulationJobData, SimulationJobResult>(
  SIMULATION_QUEUE,
  async (job): Promise<SimulationJobResult> => {
    const outcome = await runInSandbox(job.data);
    const diagnostics = parseIcarusDiagnostics(outcome.stderr);

    return {
      failure: outcome.failure,
      diagnostics,
      stdout: outcome.stdout,
      stderr: outcome.stderr,
      vcd: outcome.vcd,
      durationMs: outcome.durationMs,
      finishedAt: new Date().toISOString(),
    } satisfies Omit<SimulationResult, 'jobId' | 'status'>;
  },
  {
    connection: createRedisConnection(),
    // Cada job consome CPU/memoria do host; manter baixo na VM B2s.
    concurrency: 2,
  },
);

worker.on('failed', (job, error) => {
  console.error(`[worker] job ${job?.id ?? '?'} falhou:`, error.message);
});

// Sem listener aqui, um erro de conexao (Redis fora do ar) sobe como excecao
// nao tratada e derruba o processo inteiro - o mesmo cuidado que `redis.ts` ja
// tem do lado da API, so que o Worker precisa da conexao ativa para consumir a
// fila, entao o erro aparece de verdade (aqui, nao so ao enfileirar um job).
worker.on('error', (error) => {
  console.error('[worker] erro de conexao com o Redis:', error.message);
});

console.log(`[worker] escutando a fila "${SIMULATION_QUEUE}" (imagem ${env.SANDBOX_IMAGE})`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void worker.close().then(() => process.exit(0));
  });
}

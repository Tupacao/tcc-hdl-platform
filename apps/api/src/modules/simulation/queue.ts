import { Queue } from 'bullmq';
import type { CompileRequest, SimulationResult } from '@tplab/shared';
import { env } from '../../config/env.js';
import { createRedisConnection } from '../../lib/redis.js';

export const SIMULATION_QUEUE = 'tplab-simulation';

export type SimulationJobData = CompileRequest;
export type SimulationJobResult = Omit<SimulationResult, 'jobId' | 'status'>;

/**
 * Produtor da fila. A compilacao roda no worker (`src/worker.ts`), nunca no
 * processo da API — assim uma simulacao lenta nao bloqueia as demais rotas (RNF07).
 */
export const simulationQueue = new Queue<SimulationJobData, SimulationJobResult>(SIMULATION_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 1,
    // Cada resultado carrega stdout/stderr/.vcd inteiros — retencao dimensionada
    // pelo consumo de memoria do Redis, nao so pela contagem de jobs (RF03-I03).
    removeOnComplete: { age: env.JOB_RETENTION_SECONDS, count: env.JOB_RETENTION_COUNT },
    removeOnFail: { age: env.JOB_RETENTION_SECONDS, count: env.JOB_RETENTION_COUNT },
  },
});

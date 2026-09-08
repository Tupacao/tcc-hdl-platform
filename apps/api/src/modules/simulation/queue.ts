import { Queue } from 'bullmq';
import type { CompileRequest, SimulationResult } from '@hdl/shared';
import { createRedisConnection } from '../../lib/redis.js';

export const SIMULATION_QUEUE = 'hdl-simulation';

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
    removeOnComplete: { age: 3600, count: 500 },
    removeOnFail: { age: 3600, count: 500 },
  },
});

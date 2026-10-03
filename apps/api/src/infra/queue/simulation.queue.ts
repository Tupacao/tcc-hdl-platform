import { Queue } from 'bullmq';
import { env } from '../../config/env.js';
import type {
  SimulationJobData,
  SimulationJobResult,
} from '../../domain/simulation/dtos/simulation-job.dto.js';
import { createRedisConnection } from '../../lib/redis.js';

export const SIMULATION_QUEUE = 'tplab-simulation';

export type SimulationQueue = Queue<SimulationJobData, SimulationJobResult>;

/**
 * Produtor da fila. A compilacao roda no worker (`src/worker.ts`), nunca no
 * processo da API — assim uma simulacao lenta nao bloqueia as demais rotas (RNF07).
 *
 * Detalhe de infraestrutura: quem consome isso e
 * `application/simulation/repository/bullmq-simulation-job.repository.ts`, a
 * implementacao de `SimulationJobRepository`.
 */
export const simulationQueue: SimulationQueue = new Queue<SimulationJobData, SimulationJobResult>(
  SIMULATION_QUEUE,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 1,
      // Cada resultado carrega stdout/stderr/.vcd inteiros — retencao dimensionada
      // pelo consumo de memoria do Redis, nao so pela contagem de jobs (RF03-I03).
      removeOnComplete: { age: env.JOB_RETENTION_SECONDS, count: env.JOB_RETENTION_COUNT },
      removeOnFail: { age: env.JOB_RETENTION_SECONDS, count: env.JOB_RETENTION_COUNT },
    },
  },
);

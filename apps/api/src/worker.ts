import { Worker } from 'bullmq';
import { DefaultSimulationRunService } from './application/simulation/service/simulation-run.service.js';
import { env } from './config/env.js';
import type {
  SimulationJobData,
  SimulationJobResult,
} from './domain/simulation/dtos/simulation-job.dto.js';
import { SIMULATION_QUEUE } from './infra/queue/simulation.queue.js';
import {
  removeOrphanSandboxContainers,
  dockerSupportsSwapLimit,
  removeOrphanWorkdirs,
} from './infra/sandbox/sandbox.js';
import { logger } from './lib/logger.js';
import { recordJobOutcome } from './lib/metrics.js';
import { createRedisConnection } from './lib/redis.js';

/** Conexao separada da do BullMQ (RF03-I04) — so para os contadores em `lib/metrics.ts`. */
const metricsConnection = createRedisConnection();

/** Todo o pipeline de um job vive em `application/simulation/service` (RF04/RF05/RNF05). */
const runService = new DefaultSimulationRunService((outcome) =>
  recordJobOutcome(metricsConnection, outcome),
);

/**
 * Consumidor da fila: cada job vira um container efemero. Rodar como processo
 * separado mantem a API responsiva durante compilacoes longas (RNF07).
 */
const worker = new Worker<SimulationJobData, SimulationJobResult>(
  SIMULATION_QUEUE,
  (job) =>
    runService.run({
      jobId: String(job.id),
      data: job.data,
      queuedAt: job.timestamp,
      processedAt: job.processedOn,
    }),
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

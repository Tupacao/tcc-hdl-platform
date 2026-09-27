import type { Redis } from 'ioredis';
import type { SimulationFailure } from '@tplab/shared';
import type { WorkerMetrics } from '../domain/health/services/metrics.service.js';

/**
 * Hash unico no Redis para os contadores do worker (RF03-I04). API e worker
 * sao processos distintos — abrir uma porta HTTP no worker so para expor
 * metricas seria mais complexidade do que o problema pede; os dois ja
 * compartilham o Redis para a fila, entao reaproveitar essa conexao e o
 * caminho mais simples. `HINCRBY`/`HINCRBYFLOAT` sao atomicos, entao workers
 * concorrentes (RNF08: mais de um no futuro) nao pisam um no outro.
 *
 * Contadores zerados a cada restart do Redis (ou `FLUSHALL`) — nao sao uma
 * serie historica, so o snapshot desde a ultima vez que o hash foi criado.
 */
const METRICS_KEY = 'tplab:worker:metrics';

export interface JobOutcomeMetrics {
  failure: SimulationFailure | null;
  durationMs: number;
}

/** Chamado pelo worker ao final de cada job que chegou a rodar no sandbox. */
export async function recordJobOutcome(redis: Redis, outcome: JobOutcomeMetrics): Promise<void> {
  const field = outcome.failure ? `failure:${outcome.failure}` : 'succeeded';
  await redis
    .multi()
    .hincrby(METRICS_KEY, 'total', 1)
    .hincrby(METRICS_KEY, field, 1)
    .hincrbyfloat(METRICS_KEY, 'durationMsSum', outcome.durationMs)
    .exec();
}

/**
 * Converte o hash cru do Redis (strings) no snapshot tipado. Pura e testavel
 * sem Redis — `readWorkerMetrics` e so o `HGETALL` em volta dela.
 */
export function parseMetricsHash(raw: Record<string, string>): WorkerMetrics {
  const total = Number(raw.total ?? 0);
  const succeeded = Number(raw.succeeded ?? 0);
  const durationMsSum = Number(raw.durationMsSum ?? 0);

  const failuresByType: Record<string, number> = {};
  let failed = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith('failure:')) continue;
    const type = key.slice('failure:'.length);
    const count = Number(value);
    failuresByType[type] = count;
    failed += count;
  }

  return {
    totalJobs: total,
    succeededJobs: succeeded,
    failedJobs: failed,
    failuresByType,
    averageDurationMs: total > 0 ? durationMsSum / total : null,
  };
}

/** Chamado por `GET /health/metrics` para ler o snapshot atual. */
export async function readWorkerMetrics(redis: Redis): Promise<WorkerMetrics> {
  const raw = await redis.hgetall(METRICS_KEY);
  return parseMetricsHash(raw);
}

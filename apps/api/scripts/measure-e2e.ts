/**
 * Medicao ponta a ponta do pipeline de simulacao (RNF07-I01) — repetivel na VM alvo.
 *
 *   pnpm infra:up  (ou Redis + `pnpm dev:worker`)   # Redis e worker no ar
 *   pnpm --filter @tplab/api measure:e2e        # 20 amostras de cada cenario
 *   pnpm --filter @tplab/api measure:e2e 5 somador   # N amostras de um exemplo
 *
 * Enfileira direto no BullMQ (a rota HTTP tem limite de 10 POST/min, RF03-I02, e barraria a
 * medicao) e faz polling do estado a cada 400 ms, o mesmo intervalo de `runSimulation`
 * (apps/web/src/lib/api.ts). O tempo total e o que o usuario espera, sem a ida e volta HTTP local
 * (~ms); o detalhamento por etapa vem do campo `timings` do resultado. Cenarios com 1, 2 e 3 jobs
 * simultaneos mostram o efeito da fila (o worker tem `concurrency: 2`).
 * A primeira amostra de cada cenario e descartada. Resultados: docs/DESEMPENHO.md.
 */
import type { SimulationTimings } from '@tplab/shared';
import { simulationQueue, type SimulationJobResult } from '../src/modules/simulation/queue.js';
import { CASES, toSources } from './examples.js';

const POLL_MS = 400;
const DEADLINE_MS = 120_000;

interface Sample {
  totalMs: number;
  /** Custo de enfileirar (`queue.add`). */
  enqueueMs: number;
  /** Fim do processamento no worker ate o cliente enxergar (granularidade do polling). */
  pollLagMs: number;
  ok: boolean;
  timings: SimulationTimings | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runOnce(name: string): Promise<Sample> {
  const testCase = CASES[name];
  if (!testCase)
    throw new Error(`caso desconhecido: ${name} (opcoes: ${Object.keys(CASES).join(', ')})`);
  const started = performance.now();
  const job = await simulationQueue.add('simulate', toSources(testCase));
  const enqueueMs = performance.now() - started;

  while (performance.now() - started < DEADLINE_MS) {
    await sleep(POLL_MS);
    const state = await job.getState();
    if (state === 'completed' || state === 'failed') {
      const fresh = await simulationQueue.getJob(String(job.id));
      const value = fresh?.returnvalue as SimulationJobResult | undefined;
      const finished = fresh?.finishedOn ?? Date.now();
      return {
        totalMs: performance.now() - started,
        enqueueMs,
        pollLagMs: Math.max(0, Date.now() - finished),
        ok: state === 'completed' && value?.failure === null,
        timings: value?.timings ?? null,
      };
    }
  }
  throw new Error(`job ${job.id} passou de ${DEADLINE_MS} ms`);
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0;
}

function summarize(values: number[]): string {
  if (values.length === 0) return 'n/d';
  return `mediana=${percentile(values, 50).toFixed(0)} p95=${percentile(values, 95).toFixed(0)} max=${Math.max(...values).toFixed(0)}`;
}

function report(title: string, samples: Sample[]): void {
  console.log(`\n## ${title} (n=${samples.length})`);
  const failed = samples.filter((sample) => !sample.ok);
  if (failed.length > 0)
    console.log(`  ATENCAO: ${failed.length} job(s) nao terminaram com sucesso`);
  const timing = (key: string) =>
    samples.flatMap((sample) => {
      const value = (sample.timings as Record<string, number | null> | null)?.[key];
      return typeof value === 'number' ? [value] : [];
    });
  console.log(`  totalMs           ${summarize(samples.map((sample) => sample.totalMs))}`);
  console.log(`  enqueueMs         ${summarize(samples.map((sample) => sample.enqueueMs))}`);
  for (const key of [
    'queueWaitMs',
    'containerCreateMs',
    'executionMs',
    'compileMs',
    'simulateMs',
    'artifactsReadMs',
  ]) {
    console.log(`  ${key.padEnd(17)} ${summarize(timing(key))}`);
  }
  console.log(`  pollLagMs         ${summarize(samples.map((sample) => sample.pollLagMs))}`);
}

/** `parallel` jobs disparados juntos, repetidos `rounds` vezes (a 1a rodada e descartada). */
async function runScenario(name: string, parallel: number, rounds: number): Promise<void> {
  const samples: Sample[] = [];
  for (let round = 0; round < rounds + 1; round++) {
    const batch = await Promise.all(Array.from({ length: parallel }, () => runOnce(name)));
    if (round > 0) samples.push(...batch);
  }
  report(`${name}, ${parallel} simultaneo(s)`, samples);
}

const [first, second] = process.argv.slice(2);
const rounds = Number(first ?? 20);
if (!Number.isInteger(rounds) || rounds < 1) throw new Error('uso: measure:e2e [amostras] [caso]');
const names = second ? [second] : ['somador', 'contador4', 'pesado16'];
for (const name of names) {
  for (const parallel of [1, 2, 3]) {
    // Com 3 jobs o cenario ja e 3x mais longo: menos rodadas mantem o tempo total razoavel.
    await runScenario(name, parallel, parallel === 1 ? rounds : Math.max(3, Math.ceil(rounds / 2)));
  }
}

await simulationQueue.close();
process.exit(0);

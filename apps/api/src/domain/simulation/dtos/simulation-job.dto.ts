import type { CompileRequest, SimulationResult } from '@tplab/shared';

/** Corpo validado de `POST /api/simulations` — o que o worker recebe para executar. */
export type SimulationJobData = CompileRequest;

/**
 * Resultado que o worker devolve e a API serve no polling. `jobId` e `status` nao
 * entram aqui: vem do proprio job na fila, nao do que o worker calculou.
 */
export type SimulationJobResult = Omit<SimulationResult, 'jobId' | 'status'>;

/** Entrada do pipeline de execucao (`SimulationRunService`), com os tempos do job na fila. */
export interface SimulationRunInput {
  jobId: string;
  data: SimulationJobData;
  /** `job.timestamp` — quando o job foi enfileirado, epoch ms. */
  queuedAt: number;
  /** `job.processedOn` — quando um worker comecou a processar, epoch ms. */
  processedAt: number | undefined;
}

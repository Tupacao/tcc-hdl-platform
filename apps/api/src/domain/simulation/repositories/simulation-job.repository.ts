import type { JobStatus } from '@tplab/shared';
import type { SimulationJobData, SimulationJobResult } from '../dtos/simulation-job.dto.js';

/**
 * Estado de um job na fila, ja traduzido para o contrato publico (`JobStatus`) —
 * o mapeamento dos estados do BullMQ e detalhe da implementacao, em
 * `application/simulation/repository/bullmq-simulation-job.repository.ts`.
 */
export interface SimulationJobSnapshot {
  id: string;
  status: JobStatus;
  createdAt: Date;
  /** `null` enquanto o job nao terminou. */
  finishedAt: Date | null;
  /** Presente so quando `status === 'succeeded'`. */
  result: SimulationJobResult | null;
  /** Motivo bruto registrado pela fila quando o job falhou antes de produzir resultado. */
  failedReason: string | null;
}

/**
 * Acesso aos jobs de simulacao. A implementacao de hoje e a fila BullMQ/Redis
 * (RF03), que tambem guarda o resultado pelo tempo de retencao (RF03-I03) — daqui
 * para cima isso e um repositorio de jobs como qualquer outro.
 */
export interface SimulationJobRepository {
  /** Quantos jobs aguardam um worker — base da recusa por fila cheia (RF03-I02). */
  countWaiting(): Promise<number>;
  enqueue(data: SimulationJobData): Promise<{ id: string; createdAt: Date }>;
  findById(jobId: string): Promise<SimulationJobSnapshot | null>;
  /**
   * Posicao (1-based) na espera FIFO, ou `null` quando o job nao esta mais nela
   * (um worker o pegou entre as duas consultas) — corrida rara e inofensiva, so
   * faz a posicao sumir por um poll.
   */
  waitingPosition(jobId: string): Promise<number | null>;
}

import type { CompileRequest, SimulationJob, SimulationResult } from '@tplab/shared';

/**
 * Regra de negocio da simulacao do lado da API (RF03/RF04): decide se a submissao
 * entra na fila e monta o resultado servido no polling. A execucao em si nunca
 * acontece no processo da API — ver `SimulationRunService`, usado pelo worker.
 *
 * O controller nunca toca o repositorio da fila diretamente, sempre por aqui.
 */
export interface SimulationService {
  /**
   * Enfileira a submissao. Lanca `QueueFullError` quando a fila passou do teto e
   * `QueueUnavailableError` quando a fila nao pode ser alcancada.
   */
  enqueue(request: CompileRequest): Promise<SimulationJob>;
  /** Resultado do job (parcial enquanto roda), ou `null` se ele nao existe mais. */
  findResult(jobId: string): Promise<SimulationResult | null>;
}

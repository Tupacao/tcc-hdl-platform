import type { SimulationJobResult, SimulationRunInput } from '../dtos/simulation-job.dto.js';

/**
 * Pipeline de execucao de um job, do lado do worker: escolhe a toolchain, roda no
 * sandbox e converte a saida bruta em diagnosticos (RF05), avisos de contrato do
 * testbench (RF04-I01) e mensagens de limite (RNF05).
 *
 * Fica separado de `SimulationService` porque roda em outro processo
 * (`src/worker.ts`) e nao conhece HTTP nem fila — recebe o job pronto e devolve o
 * resultado.
 */
export interface SimulationRunService {
  run(input: SimulationRunInput): Promise<SimulationJobResult>;
}

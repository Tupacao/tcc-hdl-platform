import { useMutation } from '@tanstack/react-query';
import type { CompileRequest, SimulationResult } from '@tplab/shared';
import { runSimulation } from '@/lib/api';

/** RF03/RF04 — enfileira e acompanha a simulação via TanStack Query. `projectId` (RF07-I03) é opcional. */
export function useRunSimulation() {
  return useMutation<SimulationResult, Error, CompileRequest>({
    mutationFn: (request) => runSimulation(request),
  });
}

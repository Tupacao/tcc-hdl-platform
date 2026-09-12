import { useMutation } from '@tanstack/react-query';
import type { HdlSources, SimulationResult } from '@tplab/shared';
import { runSimulation } from '@/lib/api';

/** RF03/RF04 — enfileira e acompanha a simulacao via TanStack Query. */
export function useRunSimulation() {
  return useMutation<SimulationResult, Error, HdlSources>({
    mutationFn: (sources) => runSimulation(sources),
  });
}

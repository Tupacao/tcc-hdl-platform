import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { CompileRequest, SimulationResult } from '@tplab/shared';
import { runSimulation } from '@/lib/api';

/**
 * RF03/RF04 — enfileira e acompanha a simulação via TanStack Query. `projectId`
 * (RF07-I03) é opcional. `queued`/`queuePosition` (RF03-I02) refletem o último
 * poll enquanto o job está `queued`; ambos voltam a `false`/`null` fora desse
 * status ou entre execuções.
 */
export function useRunSimulation() {
  const [queued, setQueued] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  const mutation = useMutation<SimulationResult, Error, CompileRequest>({
    mutationFn: (request) => {
      setQueued(false);
      setQueuePosition(null);
      return runSimulation(request, undefined, (poll) => {
        setQueued(poll.status === 'queued');
        setQueuePosition(poll.status === 'queued' ? poll.queuePosition : null);
      });
    },
    onSettled: () => {
      setQueued(false);
      setQueuePosition(null);
    },
  });

  return { ...mutation, queued, queuePosition };
}

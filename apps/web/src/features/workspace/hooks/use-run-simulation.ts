import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { CompileRequest, SimulationResult } from '@tplab/shared';
import { runSimulation } from '@/lib/api';

/**
 * RF03/RF04 — enfileira e acompanha a simulação via TanStack Query. `projectId`
 * (RF07-I03) é opcional. `queued`/`queuePosition` (RF03-I02) refletem o último
 * poll enquanto o job está `queued`; ambos voltam a `false`/`null` fora desse
 * status ou entre execuções.
 *
 * `cancel` (RF04-I03) desiste do polling no navegador — o container no
 * servidor não tem rota de cancelamento e continua até o timeout (RNF05); é o
 * comportamento honesto sem essa rota existir. `mutation.reset()` depois do
 * abort evita que o `AbortError` apareça como falha: cancelar volta ao estado
 * `idle`, não a um toast vermelho.
 */
export function useRunSimulation() {
  const [queued, setQueued] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation<SimulationResult, Error, CompileRequest>({
    mutationFn: (request) => {
      setQueued(false);
      setQueuePosition(null);
      const controller = new AbortController();
      controllerRef.current = controller;
      return runSimulation(request, controller.signal, (poll) => {
        setQueued(poll.status === 'queued');
        setQueuePosition(poll.status === 'queued' ? poll.queuePosition : null);
      });
    },
    onSettled: () => {
      setQueued(false);
      setQueuePosition(null);
      controllerRef.current = null;
    },
  });

  // Sair da tela durante uma execução não deve deixar o polling órfão.
  useEffect(() => () => controllerRef.current?.abort(), []);

  function cancel() {
    controllerRef.current?.abort();
    mutation.reset();
  }

  return { ...mutation, queued, queuePosition, cancel };
}

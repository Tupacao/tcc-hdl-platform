import type { WaveTransition } from '../models/types';

/**
 * Proxima (ou anterior) marca de tempo em que QUALQUER sinal do conjunto muda de
 * valor, a partir de `currentTime`. E o que RF06-I03 usa para mover o cursor "de
 * transicao em transicao" (Shift + setas) em vez de pixel a pixel — pular por
 * pixel faria o cursor parar em instantes onde nada muda, inutil para inspecao.
 * Devolve `null` quando nao ha nenhuma transicao alem de `currentTime` naquela
 * direcao (o cursor ja esta na borda).
 */
export function nearestTransitionTime(
  transitionsBySignal: Map<string, WaveTransition[]>,
  signalIds: string[],
  currentTime: number,
  direction: 1 | -1,
): number | null {
  let candidate: number | null = null;

  for (const id of signalIds) {
    const series = transitionsBySignal.get(id);
    if (!series) continue;

    for (const transition of series) {
      if (direction === 1) {
        if (transition.time > currentTime && (candidate === null || transition.time < candidate)) {
          candidate = transition.time;
        }
      } else if (
        transition.time < currentTime &&
        (candidate === null || transition.time > candidate)
      ) {
        candidate = transition.time;
      }
    }
  }

  return candidate;
}

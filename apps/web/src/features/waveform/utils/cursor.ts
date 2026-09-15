import type { WaveTransition } from '../models/types';

/**
 * Próxima (ou anterior) marca de tempo em que QUALQUER sinal do conjunto muda de
 * valor, a partir de `currentTime`. É o que RF06-I03 usa para mover o cursor "de
 * transição em transição" (Shift + setas) em vez de pixel a pixel — pular por
 * pixel faria o cursor parar em instantes onde nada muda, inútil para inspeção.
 * Devolve `null` quando não há nenhuma transição além de `currentTime` naquela
 * direção (o cursor já está na borda).
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

import type { ViewportRange } from '../models/types';

/**
 * Aritmetica pura do viewport (RF06-I03), separada do hook para ser testavel sem
 * um renderer de React. `total` e `minSpan` sao recalculados a cada chamada pelo
 * hook (mudam quando uma nova simulacao termina).
 */

export function clampRange(
  start: number,
  end: number,
  total: number,
  minSpan: number,
): ViewportRange {
  const span = Math.min(Math.max(end - start, minSpan), total);
  let clampedStart = Math.min(Math.max(start, 0), total - span);
  if (!Number.isFinite(clampedStart)) clampedStart = 0;
  return { startTime: clampedStart, endTime: clampedStart + span };
}

export function zoomRangeAt(
  current: ViewportRange,
  time: number,
  factor: number,
  total: number,
  minSpan: number,
): ViewportRange {
  const span = current.endTime - current.startTime;
  const newSpan = span / factor;
  const ratio = newSpan / span;
  const newStart = time - (time - current.startTime) * ratio;
  return clampRange(newStart, newStart + newSpan, total, minSpan);
}

export function panRange(
  current: ViewportRange,
  deltaTime: number,
  total: number,
  minSpan: number,
): ViewportRange {
  return clampRange(current.startTime + deltaTime, current.endTime + deltaTime, total, minSpan);
}

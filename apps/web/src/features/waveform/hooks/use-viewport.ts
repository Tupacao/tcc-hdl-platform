import { useCallback, useMemo, useRef, useState } from 'react';
import type { ViewportRange } from '../models/types';
import { clampRange, panRange, zoomRangeAt } from '../utils/viewport-math';

export interface UseViewportResult {
  range: ViewportRange;
  /** Zoom centrado em `time` (o ponto sob o mouse, ou o meio da janela pelo teclado). `factor` > 1 aproxima. */
  zoomAt: (time: number, factor: number) => void;
  /** Desloca a janela no tempo, sem sair de [0, endTime]. */
  pan: (deltaTime: number) => void;
  /** Enquadra a simulacao inteira. */
  fitAll: () => void;
  /** Mesmo zoom, deslocado para o inicio. */
  goToStart: () => void;
  /** Mesmo zoom, deslocado para o fim. */
  goToEnd: () => void;
  /** Ajusta a um intervalo especifico (arrastar com Shift). */
  setRange: (start: number, end: number) => void;
  /** Zoom atual relativo ao enquadramento total, para o rotulo "100%". */
  zoomPercent: number;
}

/**
 * Estado e operacoes do viewport (RF06-I03). A aritmetica em si vive em
 * `utils/viewport-math.ts` (pura, testavel sem renderer); este hook so guarda o
 * estado React e mantem o total/minSpan mais recentes acessiveis sem recriar os
 * callbacks a cada render. O desenho (RF06-I02) so conhece
 * `{ startTime, endTime, pixelsPerTime }` — `pixelsPerTime` continua
 * responsabilidade de quem desenha (depende da largura do canvas, nao do
 * viewport em si).
 */
/**
 * Zoom maximo: 100x o enquadramento total (ex.: 10000% na barra). Sem um teto o
 * zoom "some" na pratica - o piso do vao (`minSpan`) so ficava pequeno o
 * suficiente pra virar um numero gigante e sem sentido no rotulo de porcentagem,
 * nunca travando de verdade.
 */
const MAX_ZOOM_FACTOR = 100;

export function useViewport(totalEndTime: number): UseViewportResult {
  const clampedTotal = Math.max(totalEndTime, 1e-9);
  const minSpan = clampedTotal / MAX_ZOOM_FACTOR;

  const [range, setRangeState] = useState<ViewportRange>({ startTime: 0, endTime: clampedTotal });

  const totalRef = useRef(clampedTotal);
  totalRef.current = clampedTotal;
  const minSpanRef = useRef(minSpan);
  minSpanRef.current = minSpan;

  const zoomAt = useCallback((time: number, factor: number) => {
    setRangeState((current) =>
      zoomRangeAt(current, time, factor, totalRef.current, minSpanRef.current),
    );
  }, []);

  const pan = useCallback((deltaTime: number) => {
    setRangeState((current) => panRange(current, deltaTime, totalRef.current, minSpanRef.current));
  }, []);

  const fitAll = useCallback(() => {
    setRangeState({ startTime: 0, endTime: totalRef.current });
  }, []);

  const goToStart = useCallback(() => {
    setRangeState((current) =>
      clampRange(0, current.endTime - current.startTime, totalRef.current, minSpanRef.current),
    );
  }, []);

  const goToEnd = useCallback(() => {
    setRangeState((current) => {
      const span = current.endTime - current.startTime;
      return clampRange(
        totalRef.current - span,
        totalRef.current,
        totalRef.current,
        minSpanRef.current,
      );
    });
  }, []);

  const setRange = useCallback((start: number, end: number) => {
    setRangeState(
      clampRange(Math.min(start, end), Math.max(start, end), totalRef.current, minSpanRef.current),
    );
  }, []);

  const zoomPercent = useMemo(() => {
    const span = range.endTime - range.startTime;
    return span > 0 ? Math.round((clampedTotal / span) * 100) : 100;
  }, [range, clampedTotal]);

  return { range, zoomAt, pan, fitAll, goToStart, goToEnd, setRange, zoomPercent };
}

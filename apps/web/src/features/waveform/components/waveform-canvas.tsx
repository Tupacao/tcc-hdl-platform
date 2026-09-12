import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import type { Waveform } from '../models/types';
import { draw, NAME_COLUMN_WIDTH, ROW_STEP, RULER_HEIGHT } from '../utils/render';
import { selectDisplayRows } from '../utils/rows';
import { readWaveformColors } from '../utils/theme-colors';

interface WaveformCanvasProps {
  waveform: Waveform;
}

/**
 * RF06-I02 — desenha os sinais em `<canvas>` (nao SVG/DOM: uma simulacao modesta
 * gera dezenas de milhares de transicoes). Geometria e cores seguem o Figma (frame
 * "1.2 · Formas de onda — tokens, geometria e anatomia"), nao decisao livre daqui.
 * O viewport ainda e fixo — "ajustar a largura" — RF06-I03 troca isso por
 * zoom/deslocamento interativos.
 */
export function WaveformCanvas({ waveform }: WaveformCanvasProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const rows = useMemo(() => selectDisplayRows(waveform.signals), [waveform.signals]);
  const contentHeight = RULER_HEIGHT + rows.length * ROW_STEP;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(containerWidth * dpr);
    canvas.height = Math.round(contentHeight * dpr);
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${contentHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const endTime = Math.max(waveform.endTime, 1);
    draw({
      ctx,
      rows,
      transitionsBySignal: waveform.transitions,
      endTime: waveform.endTime,
      timescale: waveform.timescale,
      timeUnit: waveform.timeUnit,
      viewport: { startTime: 0, endTime, pixelsPerTime: containerWidth / endTime },
      colors: readWaveformColors(),
      width: containerWidth,
      height: contentHeight,
    });
    // resolvedTheme nao e usado diretamente: e o gatilho para reler as cores do tema apos a troca de classe .dark.
  }, [containerWidth, contentHeight, rows, waveform, resolvedTheme]);

  return (
    <div className="flex h-full overflow-auto">
      <div className="shrink-0 border-r bg-background" style={{ width: NAME_COLUMN_WIDTH }}>
        <div style={{ height: RULER_HEIGHT }} aria-hidden />
        {rows.map((row) => (
          <div
            key={row.id}
            style={{ height: ROW_STEP }}
            title={row.scope ? `${row.scope}.${row.name}` : row.name}
            className="flex items-center px-2 text-xs text-muted-foreground"
          >
            <span className="truncate">{row.name}</span>
          </div>
        ))}
      </div>
      <div ref={containerRef} className="min-w-0 flex-1">
        <canvas ref={canvasRef} role="img" aria-label="Formas de onda da simulacao" />
      </div>
    </div>
  );
}

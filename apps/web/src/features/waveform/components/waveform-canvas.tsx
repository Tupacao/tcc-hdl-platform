import { Maximize2, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useViewport } from '../hooks/use-viewport';
import type { Viewport, Waveform } from '../models/types';
import { nearestTransitionTime } from '../utils/cursor';
import {
  formatSignalCountLabel,
  formatZoomPercentLabel,
  WAVEFORM_CANVAS_ARIA_LABEL,
  WAVEFORM_SHORTCUTS_HINT,
  ZOOM,
  formatBitWidthLabel,
} from '../utils/messages';
import { draw, NAME_COLUMN_WIDTH, ROW_STEP, RULER_HEIGHT, xToTime } from '../utils/render';
import { getSignalKey, selectDisplayRows } from '../utils/rows';
import { readWaveformColors } from '../utils/theme-colors';
import { CursorReadout } from './cursor-readout';
import { SignalList } from './signal-list';

interface WaveformCanvasProps {
  waveform: Waveform;
}

const ZOOM_FACTOR = 1.5;
const PAN_FRACTION = 0.1;
const DRAG_THRESHOLD_PX = 3;

interface DragState {
  mode: 'pan' | 'select';
  pointerId: number;
  startClientX: number;
  lastClientX: number;
  startLocalX: number;
  pixelsPerTime: number;
  moved: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface ZoomButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

/**
 * Botao de icone da barra de zoom. `title` da a dica nativa do navegador ao
 * passar o mouse (o icone sozinho nao diz o que faz); `active:` da feedback de
 * clique visivel nos dois temas — `hover:bg-accent` sozinho e quase invisivel
 * no tema claro (`--accent` e bem proximo de `--background` la).
 */
function ZoomButton({ label, onClick, children }: ZoomButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

/**
 * RF06-I02/I03 — desenha os sinais em `<canvas>` e torna o painel navegavel: zoom,
 * deslocamento, selecao de sinais e um cursor de tempo com leitura textual (frames
 * 1.2, 5.1 e 8.2 do Figma). Geometria e cores nao sao decisao livre daqui.
 */
export function WaveformCanvas({ waveform }: WaveformCanvasProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectionDraft, setSelectionDraft] = useState<{ x0: number; x1: number } | null>(null);

  const rows = useMemo(() => selectDisplayRows(waveform.signals), [waveform.signals]);
  const rowKeys = useMemo(() => rows.map(getSignalKey), [rows]);
  const rowKeysSignature = rowKeys.join('|');

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set(rowKeys));
  const [cursorTime, setCursorTime] = useState(0);
  const viewport = useViewport(waveform.endTime);

  // RF06-I03: reexecutar com os MESMOS sinais preserva selecao e zoom; sinais
  // diferentes reiniciam com tudo selecionado e a simulacao inteira enquadrada.
  // O valor inicial do ref ja e a assinatura da primeira renderizacao, entao o
  // primeiro mount nao dispara um reset redundante sobre o estado que os
  // useState acima ja inicializaram corretamente.
  const previousSignatureRef = useRef(rowKeysSignature);
  useEffect(() => {
    if (previousSignatureRef.current === rowKeysSignature) return;
    previousSignatureRef.current = rowKeysSignature;
    setSelectedKeys(new Set(rowKeys));
    viewport.fitAll();
    setCursorTime(0);
    // So a assinatura precisa disparar isto de novo; rowKeys/viewport.fitAll sao
    // lidos do fechamento mais recente no momento em que a assinatura muda.
  }, [rowKeysSignature]);

  const visibleRows = useMemo(
    () => rows.filter((row) => selectedKeys.has(getSignalKey(row))),
    [rows, selectedKeys],
  );
  const visibleRowIds = useMemo(() => visibleRows.map((row) => row.id), [visibleRows]);
  const contentHeight = RULER_HEIGHT + visibleRows.length * ROW_STEP;

  const span = viewport.range.endTime - viewport.range.startTime;
  const pixelsPerTime = containerWidth > 0 && span > 0 ? containerWidth / span : 0;
  const currentViewport: Viewport = useMemo(
    () => ({ startTime: viewport.range.startTime, endTime: viewport.range.endTime, pixelsPerTime }),
    [viewport.range, pixelsPerTime],
  );

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

    draw({
      ctx,
      rows: visibleRows,
      transitionsBySignal: waveform.transitions,
      endTime: waveform.endTime,
      timescale: waveform.timescale,
      timeUnit: waveform.timeUnit,
      viewport: currentViewport,
      colors: readWaveformColors(),
      width: containerWidth,
      height: contentHeight,
      cursorTime,
    });
    // resolvedTheme nao e usado diretamente: e o gatilho para reler as cores do tema apos a troca de classe .dark.
  }, [
    containerWidth,
    contentHeight,
    visibleRows,
    waveform,
    currentViewport,
    cursorTime,
    resolvedTheme,
  ]);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLCanvasElement>) => {
      if (!event.ctrlKey || pixelsPerTime === 0) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const time = xToTime(event.clientX - rect.left, currentViewport);
      viewport.zoomAt(time, event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);
    },
    [currentViewport, pixelsPerTime, viewport],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (event.button !== 0 || pixelsPerTime === 0) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Sem captura de ponteiro o gesto ainda funciona (os eventos so param de
        // chegar se o cursor sair do canvas durante o arraste) - nao interromper por isso.
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      dragStateRef.current = {
        mode: event.shiftKey ? 'select' : 'pan',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        lastClientX: event.clientX,
        startLocalX: localX,
        pixelsPerTime,
        moved: false,
      };
      if (event.shiftKey) setSelectionDraft({ x0: localX, x1: localX });
    },
    [pixelsPerTime],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (Math.abs(event.clientX - drag.startClientX) > DRAG_THRESHOLD_PX) drag.moved = true;

      if (drag.mode === 'pan') {
        const deltaX = event.clientX - drag.lastClientX;
        drag.lastClientX = event.clientX;
        viewport.pan(-deltaX / drag.pixelsPerTime);
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setSelectionDraft({ x0: drag.startLocalX, x1: event.clientX - rect.left });
      }
    },
    [viewport],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Idem handlePointerDown: nada a fazer se nunca houve captura.
      }
      dragStateRef.current = null;
      setSelectionDraft(null);

      const rect = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - rect.left;

      if (drag.mode === 'select' && drag.moved) {
        const t0 = xToTime(Math.min(drag.startLocalX, localX), currentViewport);
        const t1 = xToTime(Math.max(drag.startLocalX, localX), currentViewport);
        viewport.setRange(t0, t1);
      } else if (!drag.moved) {
        setCursorTime(clamp(xToTime(localX, currentViewport), 0, waveform.endTime));
      }
    },
    [currentViewport, viewport, waveform.endTime],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
      const center = (viewport.range.startTime + viewport.range.endTime) / 2;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight': {
          event.preventDefault();
          const direction = event.key === 'ArrowLeft' ? -1 : 1;
          if (event.shiftKey) {
            const next = nearestTransitionTime(
              waveform.transitions,
              visibleRowIds,
              cursorTime,
              direction,
            );
            if (next !== null) setCursorTime(next);
          } else {
            viewport.pan(direction * span * PAN_FRACTION);
          }
          break;
        }
        case '+':
        case '=':
          event.preventDefault();
          viewport.zoomAt(center, ZOOM_FACTOR);
          break;
        case '-':
        case '_':
          event.preventDefault();
          viewport.zoomAt(center, 1 / ZOOM_FACTOR);
          break;
        case 'Home':
          event.preventDefault();
          viewport.goToStart();
          break;
        case 'End':
          event.preventDefault();
          viewport.goToEnd();
          break;
        case '0':
          event.preventDefault();
          viewport.fitAll();
          break;
        default:
          break;
      }
    },
    [cursorTime, span, viewport, visibleRowIds, waveform.transitions],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b bg-muted px-2">
        <div className="ml-auto flex items-center gap-2">
          <SignalList rows={rows} selectedKeys={selectedKeys} onChange={setSelectedKeys} />
          <div className="flex items-center gap-0.5">
            <ZoomButton label={ZOOM.GO_TO_START_LABEL} onClick={() => viewport.goToStart()}>
              <SkipBack aria-hidden className="size-3.5" />
            </ZoomButton>
            <ZoomButton
              label={ZOOM.OUT_LABEL}
              onClick={() =>
                viewport.zoomAt(
                  (viewport.range.startTime + viewport.range.endTime) / 2,
                  1 / ZOOM_FACTOR,
                )
              }
            >
              <ZoomOut aria-hidden className="size-3.5" />
            </ZoomButton>
            <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
              {formatZoomPercentLabel(viewport.zoomPercent)}
            </span>
            <ZoomButton
              label={ZOOM.IN_LABEL}
              onClick={() =>
                viewport.zoomAt(
                  (viewport.range.startTime + viewport.range.endTime) / 2,
                  ZOOM_FACTOR,
                )
              }
            >
              <ZoomIn aria-hidden className="size-3.5" />
            </ZoomButton>
            <ZoomButton label={ZOOM.GO_TO_END_LABEL} onClick={() => viewport.goToEnd()}>
              <SkipForward aria-hidden className="size-3.5" />
            </ZoomButton>
            <ZoomButton label={ZOOM.FIT_ALL_LABEL} onClick={() => viewport.fitAll()}>
              <Maximize2 aria-hidden className="size-3.5" />
            </ZoomButton>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-auto">
        <div className="shrink-0 border-r bg-background" style={{ width: NAME_COLUMN_WIDTH }}>
          <div style={{ height: RULER_HEIGHT }} aria-hidden />
          {visibleRows.map((row) => (
            <div
              key={row.id}
              style={{ height: ROW_STEP }}
              title={row.scope ? `${row.scope}.${row.name}` : row.name}
              className="flex items-center justify-between gap-2 px-2 text-xs text-muted-foreground"
            >
              <span className="truncate">{row.name}</span>
              <span className="shrink-0 text-[11px]">{formatBitWidthLabel(row.width)}</span>
            </div>
          ))}
        </div>
        <div ref={containerRef} className="relative min-w-0 flex-1">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={WAVEFORM_CANVAS_ARIA_LABEL}
            tabIndex={0}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onKeyDown={handleKeyDown}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />
          {selectionDraft && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 border-x border-wave-cursor bg-wave-cursor/10"
              style={{
                left: Math.min(selectionDraft.x0, selectionDraft.x1),
                width: Math.abs(selectionDraft.x1 - selectionDraft.x0),
                height: contentHeight,
              }}
            />
          )}
        </div>
      </div>

      <CursorReadout waveform={waveform} rows={visibleRows} cursorTime={cursorTime} />
      <p className="border-t px-3 py-1 text-[11px] text-muted-foreground">
        {WAVEFORM_SHORTCUTS_HINT}
      </p>
      <p className="sr-only" aria-live="polite">
        {formatSignalCountLabel(selectedKeys.size, rows.length)}
      </p>
    </div>
  );
}

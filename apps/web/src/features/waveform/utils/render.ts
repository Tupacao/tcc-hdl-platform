import type { Viewport, WaveformColors, WaveTransition } from '../models/types';

export const ROW_HEIGHT = 28;
export const RULER_HEIGHT = 24;
const ROW_PADDING = 6;
const MIN_PIXELS_BETWEEN_TICKS = 60;
const BUS_TIP_WIDTH = 6;
const HATCH_SPACING = 5;

export interface WaveSegment {
  start: number;
  end: number;
  value: string;
}

/**
 * Converte a serie esparsa de transicoes num conjunto de segmentos continuos que
 * cobrem [0, endTime]. Antes da primeira transicao o valor e desconhecido ("x"
 * repetido pela largura), espelhando `valueAt`.
 */
export function buildSegments(
  transitions: WaveTransition[],
  endTime: number,
  width: number,
): WaveSegment[] {
  const unknown = 'x'.repeat(width);
  if (transitions.length === 0) {
    return endTime > 0 ? [{ start: 0, end: endTime, value: unknown }] : [];
  }

  const segments: WaveSegment[] = [];
  const first = transitions[0];
  if (first && first.time > 0) {
    segments.push({ start: 0, end: first.time, value: unknown });
  }

  for (let i = 0; i < transitions.length; i += 1) {
    const current = transitions[i];
    if (!current) continue;
    const next = transitions[i + 1];
    const end = next ? next.time : endTime;
    if (end > current.time) {
      segments.push({ start: current.time, end, value: current.value });
    }
  }

  return segments;
}

/** Arredonda para 1/2/5 * 10^n — o passo "redondo" classico de regua de eixo. */
function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1;
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

/** Marcas de tempo em intervalos redondos, espacadas o suficiente para nao sobrepor rotulos. */
export function computeTicks(viewport: Viewport, canvasWidth: number): number[] {
  const range = viewport.endTime - viewport.startTime;
  if (range <= 0 || canvasWidth <= 0) return [viewport.startTime];

  const maxTicks = Math.max(2, Math.floor(canvasWidth / MIN_PIXELS_BETWEEN_TICKS));
  const step = niceStep(range / maxTicks);
  const ticks: number[] = [];
  const firstTick = Math.ceil(viewport.startTime / step) * step;
  for (let tick = firstTick; tick <= viewport.endTime + 1e-9; tick += step) {
    ticks.push(Math.round(tick * 1e9) / 1e9);
  }
  return ticks;
}

export type BusRepresentation =
  { kind: 'unknown' } | { kind: 'high-z' } | { kind: 'value'; text: string };

/** Decide como um valor de barramento vira texto: hex quando totalmente definido. */
export function formatBusValue(value: string, width: number): BusRepresentation {
  if (value.includes('x')) return { kind: 'unknown' };
  if (value.includes('z')) return { kind: 'high-z' };
  const hexDigits = Math.ceil(width / 4);
  const text = BigInt(`0b${value}`).toString(16).toUpperCase().padStart(hexDigits, '0');
  return { kind: 'value', text };
}

function timeToX(time: number, viewport: Viewport): number {
  return (time - viewport.startTime) * viewport.pixelsPerTime;
}

function drawHatchRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1;
  for (let offset = -h; offset < w + h; offset += HATCH_SPACING) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + h);
    ctx.lineTo(x + offset + h, y);
    ctx.stroke();
  }
  ctx.restore();
}

function referenceY(value: string, rowTop: number, rowBottom: number): number {
  if (value === '1') return rowTop + ROW_PADDING;
  if (value === '0') return rowBottom - ROW_PADDING;
  return (rowTop + rowBottom) / 2;
}

function drawScalarRow(
  ctx: CanvasRenderingContext2D,
  segments: WaveSegment[],
  viewport: Viewport,
  rowTop: number,
  rowBottom: number,
  colors: WaveformColors,
  canvasWidth: number,
): void {
  const highY = rowTop + ROW_PADDING;
  const lowY = rowBottom - ROW_PADDING;
  const midY = (rowTop + rowBottom) / 2;

  let previousY: number | null = null;

  for (const segment of segments) {
    const x0 = Math.max(0, timeToX(segment.start, viewport));
    const x1 = Math.min(canvasWidth, timeToX(segment.end, viewport));
    if (x1 <= x0) continue;

    const y = referenceY(segment.value, rowTop, rowBottom);

    if (previousY !== null) {
      ctx.strokeStyle = colors.foreground;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, previousY);
      ctx.lineTo(x0, y);
      ctx.stroke();
    }

    if (segment.value === '0' || segment.value === '1') {
      ctx.strokeStyle = colors.foreground;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    } else if (segment.value === 'z') {
      ctx.strokeStyle = colors.warning;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x0, midY);
      ctx.lineTo(x1, midY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      drawHatchRect(ctx, x0, highY, x1 - x0, lowY - highY, colors.destructive);
    }

    previousY = y;
  }
}

function drawBusSegment(
  ctx: CanvasRenderingContext2D,
  segment: WaveSegment,
  width: number,
  viewport: Viewport,
  rowTop: number,
  rowBottom: number,
  colors: WaveformColors,
  canvasWidth: number,
  isFirst: boolean,
  isLast: boolean,
): void {
  const x0 = Math.max(0, timeToX(segment.start, viewport));
  const x1 = Math.min(canvasWidth, timeToX(segment.end, viewport));
  if (x1 <= x0) return;

  const top = rowTop + ROW_PADDING;
  const bottom = rowBottom - ROW_PADDING;
  const segmentWidth = x1 - x0;
  const tip = Math.min(BUS_TIP_WIDTH, segmentWidth / 4);
  const leftTip = isFirst ? 0 : tip;
  const rightTip = isLast ? 0 : tip;

  const representation = formatBusValue(segment.value, width);
  const strokeColor = representation.kind === 'high-z' ? colors.warning : colors.foreground;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0 + leftTip, top);
  ctx.lineTo(x1 - rightTip, top);
  ctx.lineTo(x1, (top + bottom) / 2);
  ctx.lineTo(x1 - rightTip, bottom);
  ctx.lineTo(x0 + leftTip, bottom);
  ctx.lineTo(x0, (top + bottom) / 2);
  ctx.closePath();

  if (representation.kind === 'unknown') {
    ctx.clip();
    drawHatchRect(ctx, x0, top, segmentWidth, bottom - top, colors.destructive);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0 + leftTip, top);
    ctx.lineTo(x1 - rightTip, top);
    ctx.lineTo(x1, (top + bottom) / 2);
    ctx.lineTo(x1 - rightTip, bottom);
    ctx.lineTo(x0 + leftTip, bottom);
    ctx.lineTo(x0, (top + bottom) / 2);
    ctx.closePath();
    ctx.strokeStyle = colors.destructive;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (representation.kind === 'high-z') {
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  if (representation.kind === 'value') {
    const availableWidth = segmentWidth - 2 * Math.max(leftTip, rightTip) - 4;
    ctx.font = '11px ui-monospace, monospace';
    const textWidth = ctx.measureText(representation.text).width;
    if (textWidth <= availableWidth) {
      ctx.fillStyle = colors.foreground;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(representation.text, (x0 + x1) / 2, (top + bottom) / 2);
    }
  }
}

export interface DrawRow {
  id: string;
  width: number;
}

export interface DrawParams {
  ctx: CanvasRenderingContext2D;
  rows: DrawRow[];
  transitionsBySignal: Map<string, WaveTransition[]>;
  endTime: number;
  timescale: number;
  timeUnit: string;
  viewport: Viewport;
  colors: WaveformColors;
  width: number;
  height: number;
}

/** Desenho puro: nenhuma dependencia de React ou DOM alem do CanvasRenderingContext2D recebido. */
export function draw({
  ctx,
  rows,
  transitionsBySignal,
  endTime,
  timescale,
  timeUnit,
  viewport,
  colors,
  width,
  height,
}: DrawParams): void {
  ctx.clearRect(0, 0, width, height);

  const ticks = computeTicks(viewport, width);
  ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  for (const tick of ticks) {
    const x = timeToX(tick, viewport);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.fillStyle = colors.mutedForeground;
    ctx.fillText(`${tick * timescale}${timeUnit}`, x, 2);
  }

  rows.forEach((row, index) => {
    const rowTop = RULER_HEIGHT + index * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rowBottom);
    ctx.lineTo(width, rowBottom);
    ctx.stroke();

    const transitions = transitionsBySignal.get(row.id) ?? [];
    const segments = buildSegments(transitions, endTime, row.width);

    if (row.width <= 1) {
      drawScalarRow(ctx, segments, viewport, rowTop, rowBottom, colors, width);
    } else {
      segments.forEach((segment, segmentIndex) => {
        drawBusSegment(
          ctx,
          segment,
          row.width,
          viewport,
          rowTop,
          rowBottom,
          colors,
          width,
          segmentIndex === 0,
          segmentIndex === segments.length - 1,
        );
      });
    }
  });
}

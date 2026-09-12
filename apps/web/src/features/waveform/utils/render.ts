import type { Viewport, WaveformColors, WaveTransition } from '../models/types';

/**
 * Geometria fixada pelo design (Figma, frame "1.2 · Formas de onda — tokens,
 * geometria e anatomia"; ver docs/requisitos/funcional/RF06/figma/WILL-BE-DONE.md).
 * Nao redecidir estes valores no codigo.
 */
export const BAND_HEIGHT = 24;
const ROW_GAP = 20;
export const ROW_STEP = BAND_HEIGHT + ROW_GAP;
export const NAME_COLUMN_WIDTH = 168;
const WAVE_LINE_WIDTH = 2;
const GRID_LINE_WIDTH = 1;
const BUS_TIP_WIDTH = 7;
const BUS_TEXT_MIN_WIDTH = 44;
const BUS_FONT = '11px ui-monospace, monospace';

export const RULER_HEIGHT = 24;
const MIN_PIXELS_BETWEEN_TICKS = 60;
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

export interface BusRepresentation {
  /** O valor tal como armazenado (0/1/x/z por bit) — o design mostra o texto literal,
   * nao uma conversao para hexadecimal (frame 5.1: "0011", "1111", "10xx"). */
  text: string;
  /** Algum bit indefinido: hachura em --wave-x, cor de texto de contraste (nao --wave-x). */
  hasUnknown: boolean;
  /** Nenhum bit indefinido, mas algum em alta impedancia: contorno tracejado em --wave-z. */
  isHighZ: boolean;
}

/** Decide a aparencia de um segmento de barramento a partir do valor bruto (sem conversao). */
export function formatBusValue(value: string): BusRepresentation {
  const hasUnknown = value.includes('x');
  const isHighZ = !hasUnknown && value.includes('z');
  return { text: value, hasUnknown, isHighZ };
}

function timeToX(time: number, viewport: Viewport): number {
  return (time - viewport.startTime) * viewport.pixelsPerTime;
}

/** Hachura diagonal a 45 graus ocupando a altura toda — anatomia do "x" (frame 1.2). */
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
  ctx.lineWidth = 1;
  for (let offset = -h; offset < w + h; offset += HATCH_SPACING) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + h);
    ctx.lineTo(x + offset + h, y);
    ctx.stroke();
  }
  ctx.restore();
}

function referenceY(value: string, bandTop: number, bandBottom: number): number {
  if (value === '1') return bandTop;
  if (value === '0') return bandBottom;
  return (bandTop + bandBottom) / 2;
}

function drawScalarRow(
  ctx: CanvasRenderingContext2D,
  segments: WaveSegment[],
  viewport: Viewport,
  bandTop: number,
  bandBottom: number,
  colors: WaveformColors,
  canvasWidth: number,
): void {
  const midY = (bandTop + bandBottom) / 2;
  let previousY: number | null = null;

  for (const segment of segments) {
    const x0 = Math.max(0, timeToX(segment.start, viewport));
    const x1 = Math.min(canvasWidth, timeToX(segment.end, viewport));
    if (x1 <= x0) continue;

    const y = referenceY(segment.value, bandTop, bandBottom);

    if (previousY !== null) {
      ctx.strokeStyle = colors.waveLevel;
      ctx.lineWidth = WAVE_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x0, previousY);
      ctx.lineTo(x0, y);
      ctx.stroke();
    }

    if (segment.value === '0' || segment.value === '1') {
      ctx.strokeStyle = colors.waveLevel;
      ctx.lineWidth = WAVE_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    } else if (segment.value === 'z') {
      ctx.strokeStyle = colors.waveZ;
      ctx.lineWidth = WAVE_LINE_WIDTH;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x0, midY);
      ctx.lineTo(x1, midY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      drawHatchRect(ctx, x0, bandTop, x1 - x0, bandBottom - bandTop, colors.waveX);
    }

    previousY = y;
  }
}

function busPath(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  leftTip: number,
  rightTip: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x0 + leftTip, top);
  ctx.lineTo(x1 - rightTip, top);
  ctx.lineTo(x1, (top + bottom) / 2);
  ctx.lineTo(x1 - rightTip, bottom);
  ctx.lineTo(x0 + leftTip, bottom);
  ctx.lineTo(x0, (top + bottom) / 2);
  ctx.closePath();
}

function drawBusSegment(
  ctx: CanvasRenderingContext2D,
  segment: WaveSegment,
  viewport: Viewport,
  bandTop: number,
  bandBottom: number,
  colors: WaveformColors,
  canvasWidth: number,
  isFirst: boolean,
  isLast: boolean,
): void {
  const x0 = Math.max(0, timeToX(segment.start, viewport));
  const x1 = Math.min(canvasWidth, timeToX(segment.end, viewport));
  if (x1 <= x0) return;

  const segmentWidth = x1 - x0;
  const tip = Math.min(BUS_TIP_WIDTH, segmentWidth / 4);
  const leftTip = isFirst ? 0 : tip;
  const rightTip = isLast ? 0 : tip;

  const representation = formatBusValue(segment.value);

  if (representation.hasUnknown) {
    ctx.save();
    busPath(ctx, x0, x1, bandTop, bandBottom, leftTip, rightTip);
    ctx.clip();
    drawHatchRect(ctx, x0, bandTop, segmentWidth, bandBottom - bandTop, colors.waveX);
    ctx.restore();
  }

  busPath(ctx, x0, x1, bandTop, bandBottom, leftTip, rightTip);
  ctx.strokeStyle = representation.hasUnknown ? colors.waveX : colors.waveBus;
  ctx.lineWidth = WAVE_LINE_WIDTH;
  if (representation.isHighZ) ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  if (segmentWidth >= BUS_TEXT_MIN_WIDTH) {
    // O piso de 44px (frame 1.2) foi calibrado com os exemplos de 4 bits do proprio
    // Figma ("0011", "10xx"); um barramento largo (ex.: um contador de 32 bits) pode
    // ultrapassar esse piso e ainda nao caber o texto por extenso — medir evita
    // sobrepor o segmento vizinho nesse caso que o frame nao cobriu.
    ctx.font = BUS_FONT;
    const availableWidth = segmentWidth - leftTip - rightTip - 4;
    if (ctx.measureText(representation.text).width <= availableWidth) {
      ctx.fillStyle = representation.hasUnknown ? colors.foreground : colors.waveBus;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(representation.text, (x0 + x1) / 2, (bandTop + bandBottom) / 2);
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
    ctx.strokeStyle = colors.waveGrid;
    ctx.lineWidth = GRID_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.fillStyle = colors.waveRulerForeground;
    ctx.fillText(`${tick * timescale}${timeUnit}`, x, 2);
  }

  rows.forEach((row, index) => {
    const bandTop = RULER_HEIGHT + index * ROW_STEP;
    const bandBottom = bandTop + BAND_HEIGHT;

    const transitions = transitionsBySignal.get(row.id) ?? [];
    const segments = buildSegments(transitions, endTime, row.width);

    if (row.width <= 1) {
      drawScalarRow(ctx, segments, viewport, bandTop, bandBottom, colors, width);
    } else {
      segments.forEach((segment, segmentIndex) => {
        drawBusSegment(
          ctx,
          segment,
          viewport,
          bandTop,
          bandBottom,
          colors,
          width,
          segmentIndex === 0,
          segmentIndex === segments.length - 1,
        );
      });
    }
  });
}

/** Um sinal declarado no cabeçalho do VCD. */
export interface WaveSignal {
  /** Código curto usado pelo VCD para identificar o sinal (ex.: "!", "#"). */
  id: string;
  name: string;
  /** Caminho de escopo separado por ponto, ex.: "full_adder_tb.dut". */
  scope: string;
  width: number;
  /** Tipo declarado no VCD (wire, reg, integer, real, ...), sem tratamento especial. */
  type: string;
}

/** Uma mudança de valor registrada no corpo do VCD. */
export interface WaveTransition {
  time: number;
  /** Valor em base binária como texto, preservando x/z bit a bit. */
  value: string;
}

export interface Waveform {
  /** Magnitude do $timescale (ex.: 1, 10, 100). */
  timescale: number;
  /** Unidade do $timescale (ex.: "ns", "ps"). */
  timeUnit: string;
  endTime: number;
  signals: WaveSignal[];
  /** Chaveado pelo id do VCD — vários WaveSignal podem apontar para a mesma série. */
  transitions: Map<string, WaveTransition[]>;
  /** true quando o arquivo terminou de forma abrupta (RF04-I02) e o parser parou no último registro completo. */
  truncated: boolean;
}

/**
 * Trecho do tempo desenhado no canvas. É a única entrada que RF06-I03 (zoom e
 * deslocamento) vai alterar — o desenho em si nunca conhece o restante do estado
 * de interação.
 */
export interface Viewport {
  startTime: number;
  endTime: number;
  /** Escala horizontal: pixels de canvas por unidade de $timescale. */
  pixelsPerTime: number;
}

/** O intervalo de tempo do viewport, sem `pixelsPerTime` — o que `useViewport` (RF06-I03) manipula. */
export interface ViewportRange {
  startTime: number;
  endTime: number;
}

/**
 * Cores lidas uma vez por mudança de tema, via getComputedStyle dos tokens dedicados de
 * RF06 (`docs/design-system-fundamentos.md` seção 3 — geometria e anatomia vêm do Figma,
 * frame 1.2, não de descrição textual).
 */
export interface WaveformColors {
  /** --wave-level: linha de nível lógico 0/1. */
  waveLevel: string;
  /** --wave-bus: contorno e valor de barramento definido. */
  waveBus: string;
  /** --wave-x: indefinido — hachura (sinal escalar e barramento). */
  waveX: string;
  /** --wave-z: alta impedância — linha/contorno tracejado. */
  waveZ: string;
  /** --wave-grid: grade vertical de tempo. */
  waveGrid: string;
  /** --wave-cursor: linha do cursor de tempo (RF06-I03). */
  waveCursor: string;
  /** --wave-ruler-foreground: texto da régua e dos rótulos. */
  waveRulerForeground: string;
  /** --foreground: usado só para o texto de um barramento parcialmente indefinido, que
   * precisa contrastar com a hachura em --wave-x por baixo dele. */
  foreground: string;
}

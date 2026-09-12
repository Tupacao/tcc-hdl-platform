/** Um sinal declarado no cabecalho do VCD. */
export interface WaveSignal {
  /** Codigo curto usado pelo VCD para identificar o sinal (ex.: "!", "#"). */
  id: string;
  name: string;
  /** Caminho de escopo separado por ponto, ex.: "full_adder_tb.dut". */
  scope: string;
  width: number;
  /** Tipo declarado no VCD (wire, reg, integer, real, ...), sem tratamento especial. */
  type: string;
}

/** Uma mudanca de valor registrada no corpo do VCD. */
export interface WaveTransition {
  time: number;
  /** Valor em base binaria como texto, preservando x/z bit a bit. */
  value: string;
}

export interface Waveform {
  /** Magnitude do $timescale (ex.: 1, 10, 100). */
  timescale: number;
  /** Unidade do $timescale (ex.: "ns", "ps"). */
  timeUnit: string;
  endTime: number;
  signals: WaveSignal[];
  /** Chaveado pelo id do VCD — varios WaveSignal podem apontar para a mesma serie. */
  transitions: Map<string, WaveTransition[]>;
  /** true quando o arquivo terminou de forma abrupta (RF04-I02) e o parser parou no ultimo registro completo. */
  truncated: boolean;
}

/**
 * Trecho do tempo desenhado no canvas. E a unica entrada que RF06-I03 (zoom e
 * deslocamento) vai alterar — o desenho em si nunca conhece o restante do estado
 * de interacao.
 */
export interface Viewport {
  startTime: number;
  endTime: number;
  /** Escala horizontal: pixels de canvas por unidade de $timescale. */
  pixelsPerTime: number;
}

/** Cores lidas uma vez por mudanca de tema, via getComputedStyle dos tokens de RF10. */
export interface WaveformColors {
  foreground: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  warning: string;
}

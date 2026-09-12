/** Textos fixos de interface da feature waveform — nao deixar string solta em componente. */

export const WAVEFORM_SHORTCUTS_HINT =
  'Setas: deslocar · Shift+Setas: mover cursor entre transicoes · +/-: zoom · Home/End: inicio/fim · 0: ajustar tudo';

/**
 * RF06-I04 — descricao acessivel do canvas: quantidade de sinais e intervalo
 * visivel, apontando para a tabela "Leitura no cursor" como alternativa
 * textual (o grafico em si nao expoe nada a leitor de tela).
 */
export function formatWaveformCanvasAriaLabel(
  signalCount: number,
  startTime: number,
  endTime: number,
  timescale: number,
  timeUnit: string,
): string {
  return (
    `Formas de onda de ${signalCount} sinais, de ${startTime * timescale}${timeUnit} ` +
    `a ${endTime * timescale}${timeUnit}. Os valores no instante do cursor estao na ` +
    `tabela "${CURSOR_READOUT_TITLE}" abaixo.`
  );
}

export function formatSignalCountLabel(selected: number, total: number): string {
  return `Sinais ${selected} de ${total}`;
}

export const SIGNAL = {
  LIST_ARIA_LABEL: 'Selecionar sinais exibidos',
  SEARCH_PLACEHOLDER: 'filtrar sinais',
  SELECT_ALL_LABEL: 'selecionar todos',
  CLEAR_LABEL: 'limpar',
  LIST_EMPTY_MESSAGE: 'Nenhum sinal encontrado.',
};

export function formatBitWidthLabel(width: number): string {
  return width === 1 ? '1 bit' : `${width} bits`;
}

export const CURSOR_READOUT_TITLE = 'Leitura no cursor';
export const CURSOR_READOUT_EMPTY_MESSAGE = 'Nenhum sinal selecionado para leitura.';
export const CURSOR_READOUT_COLUMN_SIGNAL = 'Sinal';
export const CURSOR_READOUT_COLUMN_VALUE = 'Valor';

export function formatCursorReadoutCaption(
  time: number,
  timescale: number,
  timeUnit: string,
): string {
  return `Valor de cada sinal selecionado no instante t = ${time * timescale}${timeUnit}`;
}

export function formatCursorTimeLabel(time: number, timescale: number, timeUnit: string): string {
  return `t = ${time * timescale}${timeUnit}`;
}

export const ZOOM = {
  GO_TO_START_LABEL: 'Ir para o inicio',
  OUT_LABEL: 'Diminuir zoom',
  IN_LABEL: 'Aumentar zoom',
  GO_TO_END_LABEL: 'Ir para o fim',
  FIT_ALL_LABEL: 'Ajustar para exibir tudo',
};

export function formatZoomPercentLabel(percent: number): string {
  return `${percent}%`;
}

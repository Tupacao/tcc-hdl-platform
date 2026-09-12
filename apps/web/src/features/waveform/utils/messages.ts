/** Textos fixos de interface da feature waveform — nao deixar string solta em componente. */

export const WAVEFORM_CANVAS_ARIA_LABEL = 'Formas de onda da simulacao';

export const WAVEFORM_SHORTCUTS_HINT =
  'Setas: deslocar · Shift+Setas: mover cursor entre transicoes · +/-: zoom · Home/End: inicio/fim · 0: ajustar tudo';

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

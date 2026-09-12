/** Textos fixos de interface da feature waveform — nao deixar string solta em componente. */

export const WAVEFORM_CANVAS_ARIA_LABEL = 'Formas de onda da simulacao';

export const WAVEFORM_SHORTCUTS_HINT =
  'Setas: deslocar · Shift+Setas: mover cursor entre transicoes · +/-: zoom · Home/End: inicio/fim · 0: ajustar tudo';

export function formatSignalCountLabel(selected: number, total: number): string {
  return `Sinais ${selected} de ${total}`;
}

export const SIGNAL_LIST_ARIA_LABEL = 'Selecionar sinais exibidos';
export const SIGNAL_SEARCH_PLACEHOLDER = 'filtrar sinais';
export const SIGNAL_SELECT_ALL_LABEL = 'selecionar todos';
export const SIGNAL_CLEAR_LABEL = 'limpar';
export const SIGNAL_LIST_EMPTY_MESSAGE = 'Nenhum sinal encontrado.';

export function formatBitWidthLabel(width: number): string {
  return width === 1 ? '1 bit' : `${width} bits`;
}

export const CURSOR_READOUT_TITLE = 'Leitura no cursor';
export const CURSOR_READOUT_EMPTY_MESSAGE = 'Nenhum sinal selecionado para leitura.';

export function formatCursorTimeLabel(time: number, timescale: number, timeUnit: string): string {
  return `t = ${time * timescale}${timeUnit}`;
}

export const ZOOM_GO_TO_START_LABEL = 'Ir para o inicio';
export const ZOOM_OUT_LABEL = 'Diminuir zoom';
export const ZOOM_IN_LABEL = 'Aumentar zoom';
export const ZOOM_GO_TO_END_LABEL = 'Ir para o fim';
export const ZOOM_FIT_ALL_LABEL = 'Ajustar para exibir tudo';

export function formatZoomPercentLabel(percent: number): string {
  return `${percent}%`;
}

/** Textos fixos de interface da feature docs — nao deixar string solta em componente. */

export const DOCS_BUTTON_LABEL = 'Documentacao';
export const PANEL_DESCRIPTION = 'Guia de inicio rapido e referencia de sintaxe do TPLab.';
export const SEARCH_PLACEHOLDER = 'Buscar por titulo ou resumo...';
export const NAV_LABEL = 'Indice da documentacao';

export function formatNoSearchResultsMessage(query: string): string {
  return `Nenhuma secao encontrada para "${query}".`;
}

export const CODE_BLOCK = {
  COPY: 'Copiar',
  COPY_SUCCESS: 'Codigo copiado.',
  COPY_ERROR: 'Nao foi possivel copiar. Selecione e copie manualmente.',
  OPEN_IN_EDITOR: 'Abrir no editor',
};

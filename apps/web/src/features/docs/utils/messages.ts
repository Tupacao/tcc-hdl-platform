/** Textos fixos de interface da feature docs — nao deixar string solta em componente. */

export const DOCS_BUTTON_LABEL = 'Documentacao';
export const PAGE_BREADCRUMB = 'Documentacao';
export const BACK_TO_EDITOR_LABEL = 'Voltar ao editor';
export const SEARCH_PLACEHOLDER = 'Buscar na documentacao';
export const NAV_LABEL = 'Indice da documentacao';

export const CATEGORY_LABELS: Record<'inicio-rapido' | 'referencia' | 'ajuda', string> = {
  'inicio-rapido': 'Inicio rapido',
  referencia: 'Referencia',
  ajuda: 'Ajuda',
};

export function formatBreadcrumb(category: string, title: string): string {
  return `${category} › ${title}`;
}

export const PREV_LABEL = 'Anterior';
export const NEXT_LABEL = 'Proximo';

export function formatNoSearchResultsMessage(query: string): string {
  return `Nada encontrado para "${query}".`;
}

export function formatOutOfScopeMessage(equivalent: string): string {
  return `Este termo nao faz parte desta versao. Em Verilog o equivalente e ${equivalent}.`;
}

export const SEARCH_EMPTY = {
  SUGGESTIONS_LABEL: 'Sugestoes',
  NOT_IMPLEMENTED_LINK: 'O que o TP Lab nao faz',
};

export const CODE_BLOCK = {
  COPY: 'Copiar',
  COPY_SUCCESS: 'Codigo copiado.',
  COPY_ERROR: 'Nao foi possivel copiar. Selecione e copie manualmente.',
  OPEN_IN_EDITOR: 'Abrir no editor',
};

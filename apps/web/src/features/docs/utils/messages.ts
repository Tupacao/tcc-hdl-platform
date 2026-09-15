/** Textos fixos de interface da feature docs — não deixar string solta em componente. */

export const DOCS_BUTTON_LABEL = 'Documentação';
export const PAGE_BREADCRUMB = 'Documentação';
export const BACK_TO_EDITOR_LABEL = 'Voltar ao editor';
export const SEARCH_PLACEHOLDER = 'Buscar na documentação';
export const NAV_LABEL = 'Índice da documentação';

export const CATEGORY_LABELS: Record<'inicio-rapido' | 'referencia' | 'ajuda', string> = {
  'inicio-rapido': 'Início rápido',
  referencia: 'Referência',
  ajuda: 'Ajuda',
};

export function formatBreadcrumb(category: string, title: string): string {
  return `${category} › ${title}`;
}

export const PREV_LABEL = 'Anterior';
export const NEXT_LABEL = 'Próximo';

export function formatNoSearchResultsMessage(query: string): string {
  return `Nada encontrado para "${query}".`;
}

export function formatOutOfScopeMessage(equivalent: string): string {
  return `Este termo não faz parte desta versão. Em Verilog o equivalente é ${equivalent}.`;
}

export const SEARCH_EMPTY = {
  SUGGESTIONS_LABEL: 'Sugestões',
  NOT_IMPLEMENTED_LINK: 'O que o TP Lab não faz',
};

export const CODE_BLOCK = {
  COPY: 'Copiar',
  COPY_SUCCESS: 'Código copiado.',
  COPY_ERROR: 'Não foi possível copiar. Selecione e copie manualmente.',
  OPEN_IN_EDITOR: 'Abrir no editor',
};

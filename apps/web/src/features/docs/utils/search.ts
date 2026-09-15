import type { DocSection } from '../models/types';

/**
 * Filtro simples por titulo e resumo (RF11-I01) - sem indexador, o volume de
 * secoes nao justifica. `query` vazia devolve tudo.
 */
export function filterSections(sections: DocSection[], query: string): DocSection[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return sections;

  return sections.filter(
    (section) =>
      section.title.toLowerCase().includes(normalized) ||
      section.summary.toLowerCase().includes(normalized),
  );
}

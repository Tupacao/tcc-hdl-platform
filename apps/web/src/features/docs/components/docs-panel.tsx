import { useMemo, useState } from 'react';
import type { HdlSources } from '@tplab/shared';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { DOC_SECTIONS } from '../content';
import { filterSections } from '../utils/search';
import {
  formatNoSearchResultsMessage,
  NAV_LABEL,
  PANEL_DESCRIPTION,
  SEARCH_PLACEHOLDER,
} from '../utils/messages';
import { DocsIndex } from './docs-index';

interface DocsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** RF07-I03: quem monta o painel decide se avisa sobre alteracoes nao salvas. */
  onOpenInEditor: (sources: HdlSources) => void;
}

/**
 * Superficie de documentacao (RF11-I01) - painel lateral sobre a tela atual, em
 * vez de rota propria: preserva o estado do workspace por baixo e dispensa
 * roteador so para tres paginas de conteudo estatico (decisao registrada em
 * `docs/requisitos/funcional/RF11/issue-01-navegacao-e-layout-docs.md`).
 */
export function DocsPanel({ open, onOpenChange, onOpenInEditor }: DocsPanelProps) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(DOC_SECTIONS[0]?.id ?? null);

  const filtered = useMemo(() => filterSections(DOC_SECTIONS, query), [query]);
  const activeSection = DOC_SECTIONS.find((section) => section.id === activeId) ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle asChild>
            <h1 className="text-base font-semibold">{activeSection?.title ?? NAV_LABEL}</h1>
          </SheetTitle>
          <SheetDescription>{PANEL_DESCRIPTION}</SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr]">
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto border-r p-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={SEARCH_PLACEHOLDER}
              aria-label={SEARCH_PLACEHOLDER}
            />
            {filtered.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">
                {formatNoSearchResultsMessage(query)}
              </p>
            ) : (
              <DocsIndex sections={filtered} activeId={activeId} onSelect={setActiveId} />
            )}
          </div>

          <div className="min-h-0 overflow-y-auto p-4">
            {activeSection && <activeSection.Component onOpenInEditor={onOpenInEditor} />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

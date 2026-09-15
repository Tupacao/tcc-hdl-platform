import { useMemo, useState } from 'react';
import { CircuitBoard } from 'lucide-react';
import type { HdlSources } from '@tplab/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { DOC_SECTIONS, OUT_OF_SCOPE_SECTION_ID } from '../content';
import { filterSections } from '../utils/search';
import {
  BACK_TO_EDITOR_LABEL,
  CATEGORY_LABELS,
  formatBreadcrumb,
  NEXT_LABEL,
  PAGE_BREADCRUMB,
  PREV_LABEL,
  SEARCH_PLACEHOLDER,
} from '../utils/messages';
import { DocsNav } from './docs-nav';
import { DocsSearchEmpty } from './docs-search-empty';

interface DocsPageProps {
  onNavigateBack: () => void;
  /** RF07-I03: quem monta a pagina decide se avisa sobre alteracoes nao salvas. */
  onOpenInEditor: (sources: HdlSources) => void;
  /** RF01 - link "Ver os limites em detalhe" da home abre ja na secao certa. */
  initialSectionId?: string;
}

/**
 * Documentacao (RF11-I01) - pagina propria, nao sobreposta ao workspace
 * (decisao fechada no Figma: `docs/requisitos/funcional/RF11/figma/
 * WILL-BE-DONE.md`, "documentacao e pagina propria"). Troca de tela como
 * "Meus projetos" ja faz - App.tsx desmonta o Workspace, o rascunho local
 * de RF07-I03 cobre o intervalo.
 */
export function DocsPage({ onNavigateBack, onOpenInEditor, initialSectionId }: DocsPageProps) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(initialSectionId ?? DOC_SECTIONS[0]?.id ?? null);

  const filtered = useMemo(() => filterSections(DOC_SECTIONS, query), [query]);
  const activeIndex = DOC_SECTIONS.findIndex((section) => section.id === activeId);
  const activeSection = activeIndex >= 0 ? DOC_SECTIONS[activeIndex] : null;
  const previousSection = activeIndex > 0 ? (DOC_SECTIONS[activeIndex - 1] ?? null) : null;
  const nextSection =
    activeIndex >= 0 && activeIndex < DOC_SECTIONS.length - 1
      ? (DOC_SECTIONS[activeIndex + 1] ?? null)
      : null;

  function selectSection(id: string) {
    setActiveId(id);
    setQuery('');
  }

  return (
    <div className="flex h-full min-w-[1024px] flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <CircuitBoard aria-hidden className="size-5" />
        <h1 className="text-sm font-semibold">TPLab</h1>
        <span className="text-xs text-muted-foreground">{PAGE_BREADCRUMB}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onNavigateBack}>
            {BACK_TO_EDITOR_LABEL}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r p-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            aria-label={SEARCH_PLACEHOLDER}
          />
          {filtered.length === 0 ? (
            <DocsSearchEmpty
              query={query}
              onSearchTerm={setQuery}
              onNavigateToSection={selectSection}
              outOfScopeSectionId={OUT_OF_SCOPE_SECTION_ID}
            />
          ) : (
            <DocsNav sections={filtered} activeId={activeId} onSelect={selectSection} />
          )}
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
          {activeSection && (
            <div className="mx-auto flex max-w-[72ch] flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {formatBreadcrumb(CATEGORY_LABELS[activeSection.category], activeSection.title)}
                </p>
                <h1 className="mt-1 text-2xl font-semibold">{activeSection.title}</h1>
              </div>

              <activeSection.Component onOpenInEditor={onOpenInEditor} />

              {(previousSection ?? nextSection) && (
                <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4 text-sm">
                  <NavLink
                    section={previousSection}
                    label={PREV_LABEL}
                    align="left"
                    onSelect={selectSection}
                  />
                  <NavLink
                    section={nextSection}
                    label={NEXT_LABEL}
                    align="right"
                    onSelect={selectSection}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  section,
  label,
  align,
  onSelect,
}: {
  section: (typeof DOC_SECTIONS)[number] | null;
  label: string;
  align: 'left' | 'right';
  onSelect: (id: string) => void;
}) {
  if (!section) return <span />;

  return (
    <button
      type="button"
      onClick={() => onSelect(section.id)}
      className={cn(
        'flex flex-col rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        align === 'right' ? 'items-end text-right' : 'items-start text-left',
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{section.title}</span>
    </button>
  );
}

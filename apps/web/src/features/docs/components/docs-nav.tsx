import { cn } from '@/lib/utils';
import type { DocCategory, DocSection } from '../models/types';
import { CATEGORY_LABELS, NAV_LABEL } from '../utils/messages';

interface DocsNavProps {
  sections: DocSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

const CATEGORY_ORDER: DocCategory[] = ['inicio-rapido', 'referencia', 'ajuda'];

/** Índice navegável, agrupado por categoria (Figma 7.1: INÍCIO RÁPIDO / REFERÊNCIA / AJUDA). */
export function DocsNav({ sections, activeId, onSelect }: DocsNavProps) {
  return (
    <nav aria-label={NAV_LABEL} className="flex flex-col gap-5">
      {CATEGORY_ORDER.map((category) => {
        const items = sections.filter((section) => section.category === category);
        if (items.length === 0) return null;

        return (
          <div key={category} className="flex flex-col gap-1">
            <h2 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {CATEGORY_LABELS[category]}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {items.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    aria-current={section.id === activeId ? 'true' : undefined}
                    onClick={() => onSelect(section.id)}
                    className={cn(
                      'w-full rounded-md border-l-[3px] py-1.5 pr-2 pl-[calc(0.5rem-3px)] text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      section.id === activeId
                        ? 'border-primary bg-accent font-medium text-accent-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    )}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

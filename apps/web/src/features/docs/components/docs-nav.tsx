import { cn } from '@/lib/utils';
import type { DocCategory, DocSection } from '../models/types';
import { CATEGORY_LABELS, NAV_LABEL } from '../utils/messages';

interface DocsNavProps {
  sections: DocSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

const CATEGORY_ORDER: DocCategory[] = ['inicio-rapido', 'referencia', 'ajuda'];

/** Indice navegavel, agrupado por categoria (Figma 7.1: INICIO RAPIDO / REFERENCIA / AJUDA). */
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
                      'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      section.id === activeId
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
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

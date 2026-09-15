import { cn } from '@/lib/utils';
import type { DocSection } from '../models/types';
import { NAV_LABEL } from '../utils/messages';

interface DocsIndexProps {
  sections: DocSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

/** Indice navegavel da documentacao (RF11-I01) - navegacao semantica, destaca a secao ativa. */
export function DocsIndex({ sections, activeId, onSelect }: DocsIndexProps) {
  return (
    <nav aria-label={NAV_LABEL} className="flex flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {sections.map((section) => (
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
    </nav>
  );
}

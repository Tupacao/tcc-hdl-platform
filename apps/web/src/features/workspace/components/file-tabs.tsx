import { CircleX } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { HdlSources } from '@tplab/shared';
import { cn } from '@/lib/utils';
import { FILE_TABS } from '../utils/messages';
import type { WorkspaceFile } from '../hooks/use-project-link';

interface FileTabsProps {
  sources: HdlSources;
  activeTab: WorkspaceFile;
  onSelectTab: (tab: WorkspaceFile) => void;
  /** Prefixo dos ids, compartilhado com o `tabpanel` do editor (aria-controls/aria-labelledby). */
  idPrefix: string;
  /** Arquivos que têm ao menos um erro de compilação (RF05). */
  filesWithErrors: Record<WorkspaceFile, boolean>;
  /** Arquivos com alterações não salvas (RF07-I03). */
  dirtyFiles: Record<WorkspaceFile, boolean>;
}

const TABS: WorkspaceFile[] = ['design', 'testbench'];

export function fileTabId(idPrefix: string, tab: WorkspaceFile): string {
  return `${idPrefix}-tab-${tab}`;
}

export function fileTabPanelId(idPrefix: string): string {
  return `${idPrefix}-tabpanel`;
}

/**
 * Abas de arquivo no padrão ARIA (RF09-I03): só a aba ativa entra na ordem de Tab;
 * setas esquerda/direita, Home e End movem foco e seleção. Erro e alteração não
 * salva são marcados por ícone/símbolo e texto para leitor de tela - nunca só por cor.
 */
export function FileTabs({
  sources,
  activeTab,
  onSelectTab,
  idPrefix,
  filesWithErrors,
  dirtyFiles,
}: FileTabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.indexOf(activeTab);
    let next: WorkspaceFile | undefined;
    if (event.key === 'ArrowRight') next = TABS[(index + 1) % TABS.length];
    else if (event.key === 'ArrowLeft') next = TABS[(index - 1 + TABS.length) % TABS.length];
    else if (event.key === 'Home') next = TABS[0];
    else if (event.key === 'End') next = TABS[TABS.length - 1];
    if (next === undefined) return;

    event.preventDefault();
    onSelectTab(next);
    document.getElementById(fileTabId(idPrefix, next))?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={FILE_TABS.LABEL}
      onKeyDown={handleKeyDown}
      className="flex border-b"
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={fileTabId(idPrefix, tab)}
            data-workspace-file-tab
            aria-selected={selected}
            aria-controls={fileTabPanelId(idPrefix)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelectTab(tab)}
            className={cn(
              'flex items-center gap-2 border-r border-b-2 px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-b-primary bg-background font-medium'
                : 'border-b-transparent bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="font-mono">{sources[tab].name}</span>
            <span
              className={cn(
                'rounded-[5px] px-1.5 py-px font-mono text-[9.5px] font-medium',
                selected ? 'bg-primary/15 text-primary-strong' : 'bg-background/60',
              )}
            >
              {FILE_TABS.ROLES[tab]}
            </span>
            {filesWithErrors[tab] && (
              <>
                <CircleX aria-hidden className="size-3.5 text-destructive" />
                <span className="sr-only">{FILE_TABS.HAS_ERRORS}</span>
              </>
            )}
            {dirtyFiles[tab] && (
              <>
                <span aria-hidden className="text-[11px] leading-none text-warning">
                  ●
                </span>
                <span className="sr-only">{FILE_TABS.UNSAVED}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

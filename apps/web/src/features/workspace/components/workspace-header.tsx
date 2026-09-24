import {
  BookOpen,
  CircuitBoard,
  Download,
  FolderOpen,
  Keyboard,
  LayoutTemplate,
  Loader2,
  Play,
  Save,
} from 'lucide-react';
import type { LocalProject } from '@/features/projects';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { DOCS_BUTTON_LABEL } from '@/features/docs';
import {
  EXPORT_BUTTON_LABEL,
  OPEN_PROJECTS_BUTTON_LABEL,
  RESET_LAYOUT_BUTTON_LABEL,
  SAVE_BUTTON_LABEL,
  SAVED_INDICATOR_LABEL,
  UNSAVED_INDICATOR_LABEL,
} from '../utils/messages';
import { SHORTCUTS_DIALOG, formatCombo, getShortcut, isMacPlatform } from '../utils/shortcuts';

interface WorkspaceHeaderProps {
  /** `null` no rascunho anônimo (RF20) - sem nome, sem indicador, sem "Salvar"/"Exportar". */
  project: LocalProject | null;
  isDirty: boolean;
  onSave: () => void;
  /** RF08 - exporta as fontes ao vivo do editor, não a versão salva. */
  onExport: () => void;
  onOpenProjects?: () => void;
  onOpenDocs: () => void;
  onRun: () => void;
  isRunning: boolean;
  /** RF09-I01 - volta os painéis ao tamanho padrão e apaga o layout salvo. */
  onResetLayout: () => void;
  /** RF09-I02 - abre o diálogo de atalhos de teclado. */
  onOpenShortcuts: () => void;
}

/** RF07-I03 - cabeçalho do workspace com identidade, projeto aberto e ações. */
export function WorkspaceHeader({
  project,
  isDirty,
  onSave,
  onExport,
  onOpenProjects,
  onOpenDocs,
  onRun,
  isRunning,
  onResetLayout,
  onOpenShortcuts,
}: WorkspaceHeaderProps) {
  const runButtonTitle = `${SHORTCUTS_DIALOG.RUN_BUTTON_HINT} (${formatCombo(getShortcut('run').combo, isMacPlatform()).join('+')})`;

  return (
    <header className="flex items-center gap-3 border-b px-4 py-2">
      <CircuitBoard aria-hidden className="size-5" />
      <h1 className="text-sm font-semibold">TP Lab</h1>

      {project ? (
        <div className="flex items-center gap-1.5">
          <span className="max-w-40 truncate text-xs font-medium">{project.name}</span>
          <span
            aria-hidden
            className={isDirty ? 'size-1.5 shrink-0 rounded-full bg-warning' : 'size-1.5 shrink-0'}
          />
          <span className="sr-only">
            {isDirty ? UNSAVED_INDICATOR_LABEL : SAVED_INDICATOR_LABEL}
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Verilog</span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {project && (
          <Button variant="outline" size="sm" onClick={onSave} disabled={!isDirty}>
            <Save aria-hidden />
            {SAVE_BUTTON_LABEL}
          </Button>
        )}
        {project && (
          <Button variant="ghost" size="icon" aria-label={EXPORT_BUTTON_LABEL} onClick={onExport}>
            <Download aria-hidden />
          </Button>
        )}
        {onOpenProjects && (
          <Button variant="ghost" size="sm" onClick={onOpenProjects}>
            <FolderOpen aria-hidden />
            {OPEN_PROJECTS_BUTTON_LABEL}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onOpenDocs}>
          <BookOpen aria-hidden />
          {DOCS_BUTTON_LABEL}
        </Button>
        <Button onClick={onRun} disabled={isRunning} size="sm" title={runButtonTitle}>
          {isRunning ? <Loader2 aria-hidden className="animate-spin" /> : <Play aria-hidden />}
          {isRunning ? 'Executando' : 'Executar'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={SHORTCUTS_DIALOG.BUTTON_LABEL}
          title={SHORTCUTS_DIALOG.BUTTON_LABEL}
          onClick={onOpenShortcuts}
        >
          <Keyboard aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={RESET_LAYOUT_BUTTON_LABEL}
          title={RESET_LAYOUT_BUTTON_LABEL}
          onClick={onResetLayout}
        >
          <LayoutTemplate aria-hidden />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}

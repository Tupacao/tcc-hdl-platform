import { useMemo, useRef, useState } from 'react';
import { BookOpen, CircuitBoard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { DOCS_BUTTON_LABEL } from '@/features/docs';
import type { UseLocalProjectsResult } from '../hooks/use-local-projects';
import type { LocalProject } from '../models/types';
import {
  EMPTY_STATE,
  formatDeleteToast,
  formatNoSearchResultsMessage,
  formatProjectCountSubtitle,
  NEW_PROJECT_BUTTON_LABEL,
  NAVIGATE_BACK_LABEL,
  NEW_PROJECT_CARD,
  PAGE_TITLE,
  SEARCH_PLACEHOLDER,
  STORAGE_ERROR,
  STORAGE_NOTICE,
  UNDO_LABEL,
} from '../utils/messages';
import { DeleteProjectDialog } from './delete-project-dialog';
import { NewProjectDialog } from './new-project-dialog';
import { ProjectCard } from './project-card';
import { RenameProjectDialog } from './rename-project-dialog';

interface ProjectsPageProps {
  /**
   * Mesma instancia de `useLocalProjects` usada pelo `Workspace` (App.tsx) -
   * nao um hook proprio aqui: duas instancias leriam o `localStorage` cada
   * uma na sua vez e nunca veriam a escrita uma da outra (RF07-I03).
   */
  localProjects: UseLocalProjectsResult;
  onOpenProject: (project: LocalProject) => void;
  onNavigateBack: () => void;
  /** RF11: navega para a documentacao (pagina propria, nao sobreposta). */
  onOpenDocs: () => void;
}

/** Pagina "Meus projetos" (RF07-I02, frame 6.1 do Figma). */
export function ProjectsPage({
  localProjects,
  onOpenProject,
  onNavigateBack,
  onOpenDocs,
}: ProjectsPageProps) {
  const { projects, loadError, retryLoad, create, rename, duplicate, remove, restore } =
    localProjects;
  const [query, setQuery] = useState('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newDialogStartPoint, setNewDialogStartPoint] = useState<'blank' | 'sample'>('blank');
  const [renameTarget, setRenameTarget] = useState<LocalProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalProject | null>(null);

  // Os 3 dialogos abrem a partir de varios botoes diferentes (cabecalho, cards,
  // estado vazio) - nao de um `DialogTrigger` fixo, entao o retorno de foco
  // automatico do Radix nao se aplica. Guarda quem tinha foco antes de abrir
  // para devolver ao fechar (sem isso o foco cai no `<body>`).
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  function captureFocus() {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
  }

  function restoreFocus() {
    lastFocusedRef.current?.focus();
  }

  const existingNames = useMemo(() => projects.map((project) => project.name), [projects]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(normalized));
  }, [projects, query]);

  function openNewDialog(startPoint: 'blank' | 'sample') {
    captureFocus();
    setNewDialogStartPoint(startPoint);
    setNewDialogOpen(true);
  }

  function openRenameDialog(project: LocalProject) {
    setRenameTarget(project);
  }

  function openDeleteDialog(project: LocalProject) {
    setDeleteTarget(project);
  }

  /**
   * Escrever no `localStorage` pode falhar (quota, modo privado) - captura
   * aqui em vez de deixar a excecao subir e quebrar o clique que a disparou.
   */
  function runOrToastError(action: () => void): void {
    try {
      action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  function handleDelete(id: string) {
    runOrToastError(() => {
      const removed = remove(id);
      setDeleteTarget(null);
      if (!removed) return;

      toast.success(formatDeleteToast(removed.name), {
        duration: 8000,
        action: { label: UNDO_LABEL, onClick: () => runOrToastError(() => restore(removed)) },
      });
    });
  }

  return (
    <div className="flex h-full min-w-[1024px] flex-col overflow-auto">
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <CircuitBoard aria-hidden className="size-5" />
        <h1 className="text-sm font-semibold">TPLab</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onOpenDocs}>
            <BookOpen aria-hidden />
            {DOCS_BUTTON_LABEL}
          </Button>
          <Button variant="ghost" size="sm" onClick={onNavigateBack}>
            {NAVIGATE_BACK_LABEL}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{PAGE_TITLE}</h2>
            <p className="text-sm text-muted-foreground">
              {loadError
                ? STORAGE_ERROR.LOAD_TITLE
                : projects.length === 0
                  ? EMPTY_STATE.SUBTITLE
                  : formatProjectCountSubtitle(projects.length)}
            </p>
          </div>

          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={SEARCH_PLACEHOLDER}
                className="w-64"
                aria-label={SEARCH_PLACEHOLDER}
              />
              <Button onClick={() => openNewDialog('blank')}>
                <Plus aria-hidden />
                {NEW_PROJECT_BUTTON_LABEL}
              </Button>
            </div>
          )}
        </div>

        {loadError ? (
          <LoadErrorState message={loadError} onRetry={retryLoad} />
        ) : projects.length === 0 ? (
          <EmptyState
            onCreateBlank={() => openNewDialog('blank')}
            onStartFromSample={() => openNewDialog('sample')}
          />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{formatNoSearchResultsMessage(query)}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => onOpenProject(project)}
                onRename={() => openRenameDialog(project)}
                onDuplicate={() => runOrToastError(() => duplicate(project.id))}
                onDelete={() => openDeleteDialog(project)}
                onMenuTriggerFocusable={(trigger) => {
                  lastFocusedRef.current = trigger;
                }}
              />
            ))}
            <NewProjectCard onClick={() => openNewDialog('blank')} />
          </div>
        )}

        {projects.length > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border bg-muted/50 p-4 text-sm">
            <div>
              <p className="font-medium">{STORAGE_NOTICE.TITLE}</p>
              <p className="text-xs text-muted-foreground">{STORAGE_NOTICE.BODY}</p>
            </div>
          </div>
        )}
      </div>

      <NewProjectDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        existingNames={existingNames}
        onCreate={(input) => runOrToastError(() => create(input))}
        defaultStartPoint={newDialogStartPoint}
        onRestoreFocus={restoreFocus}
      />
      <RenameProjectDialog
        project={renameTarget}
        existingNames={existingNames}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        onRename={(id, name) => runOrToastError(() => rename(id, name))}
        onRestoreFocus={restoreFocus}
      />
      <DeleteProjectDialog
        project={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        onRestoreFocus={restoreFocus}
      />
    </div>
  );
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors hover:border-ring hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary-strong">
        <Plus aria-hidden className="size-5" />
      </span>
      <span className="text-sm font-medium">{NEW_PROJECT_CARD.TITLE}</span>
      <span className="text-xs text-muted-foreground">{NEW_PROJECT_CARD.SUBTITLE}</span>
    </button>
  );
}

function LoadErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border p-12 text-center">
      <h3 className="text-lg font-semibold">{STORAGE_ERROR.LOAD_TITLE}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry}>{STORAGE_ERROR.RETRY}</Button>
    </div>
  );
}

function EmptyState({
  onCreateBlank,
  onStartFromSample,
}: {
  onCreateBlank: () => void;
  onStartFromSample: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border p-12 text-center">
      <h3 className="text-lg font-semibold">{EMPTY_STATE.TITLE}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{EMPTY_STATE.BODY}</p>
      <div className="flex gap-2">
        <Button onClick={onCreateBlank}>
          <Plus aria-hidden />
          {EMPTY_STATE.CREATE_BLANK}
        </Button>
        <Button variant="outline" onClick={onStartFromSample}>
          {EMPTY_STATE.START_FROM_SAMPLE}
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{EMPTY_STATE.FOOTER}</p>
    </div>
  );
}

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Panel, PanelGroup, type ImperativePanelGroupHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import type { Diagnostic, HdlSources, SimulationResult } from '@tplab/shared';
import {
  buildExportFileName,
  buildProjectZip,
  downloadProjectZip,
  type LastRunStatus,
  type LocalProject,
} from '@/features/projects';
import { cn } from '@/lib/utils';
import { CodeEditor, type CodeEditorHandle } from './components/code-editor';
import { ConsolePanel, type ConsolePanelHandle } from './components/console-panel';
import { FileTabs, fileTabId, fileTabPanelId } from './components/file-tabs';
import { ResizeHandle } from './components/resize-handle';
import { StatusBar } from './components/status-bar';
import { ShortcutsDialog } from './components/shortcuts-dialog';
import { RestoreDraftDialog } from './components/restore-draft-dialog';
import { UnsavedChangesDialog } from './components/unsaved-changes-dialog';
import { WaveformPanel } from './components/waveform-panel';
import { WorkspaceHeader } from './components/workspace-header';
import { useProjectLink, type WorkspaceFile } from './hooks/use-project-link';
import { useRunSimulation } from './hooks/use-run-simulation';
import { cycleIndex, navigableDiagnostics } from './utils/diagnostic-navigation';
import {
  DEFAULT_HORIZONTAL_LAYOUT,
  DEFAULT_VERTICAL_LAYOUT,
  HORIZONTAL_LAYOUT_KEY,
  PANEL_MIN_SIZE,
  VERTICAL_LAYOUT_KEY,
  loadLayout,
  saveLayout,
} from './utils/layout';
import { EXPORT_ERROR_MESSAGE, RESIZE_HANDLE } from './utils/messages';
import { buildRunStatus } from './utils/run-status';
import {
  SHORTCUTS,
  isEditableTarget,
  isMacPlatform,
  matchesShortcut,
  type ShortcutId,
} from './utils/shortcuts';

interface WorkspaceProps {
  /** Projeto aberto (RF07-I03). `null` no rascunho anônimo (RF20), que segue sem exigir conta. */
  project: LocalProject | null;
  /**
   * Substitui a fonte inicial do editor - RF20 (`SAMPLE_SOURCES`) por padrão
   * no rascunho anônimo, ou um exemplo de RF11 escolhido em "Abrir no
   * editor" (com ou sem projeto aberto - ver `useProjectLink`).
   */
  overrideSources?: HdlSources;
  onSaveProject: (id: string, sources: HdlSources) => void;
  onRecordRun: (id: string, status: LastRunStatus) => void;
  /** RF07-I02: navega para "Meus projetos". Omitido quando não há lista de projetos por perto. */
  onOpenProjects?: () => void;
  /** RF11: navega para a documentação (página própria, não sobreposta). */
  onOpenDocs: () => void;
}

/**
 * RF09 — editor, compilador, simulador e visualizador em uma única interface.
 * Os painéis são redimensionáveis para caber em telas a partir de 1024px (RNF03).
 */
export function Workspace({
  project,
  overrideSources,
  onSaveProject,
  onRecordRun,
  onOpenProjects,
  onOpenDocs,
}: WorkspaceProps) {
  const { sources, updateFile, isDirty, dirtyFiles, save, pendingDraft, useDraft, discardDraft } =
    useProjectLink(project, onSaveProject, overrideSources);
  const [activeTab, setActiveTab] = useState<WorkspaceFile>('design');
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // RF09-I02 - posição do F8 na lista de diagnósticos navegáveis; zera a cada nova execução.
  const diagnosticCursorRef = useRef<number | null>(null);
  const runMutation = useRunSimulation();
  const codeEditorRef = useRef<CodeEditorHandle>(null);
  const consolePanelRef = useRef<ConsolePanelHandle>(null);
  const idPrefix = useId();
  const [cursor, setCursor] = useState<{ line: number; column: number } | null>(null);
  // RF09-I01 - layout salvo lido uma vez, na montagem; `Panel` só usa o defaultSize inicial.
  const [initialHorizontal] = useState(() => loadLayout(HORIZONTAL_LAYOUT_KEY));
  const [initialVertical] = useState(() => loadLayout(VERTICAL_LAYOUT_KEY));
  const horizontalGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const verticalGroupRef = useRef<ImperativePanelGroupHandle>(null);
  // RF05-I02 - diagnóstico escolhido no console aguardando a troca de aba
  // terminar de renderizar, para então revelar a posição no editor certo.
  const [pendingReveal, setPendingReveal] = useState<{
    file: string;
    line: number;
    column: number | null;
  } | null>(null);
  // `useMutation` limpa `data` assim que uma nova chamada começa (fica undefined
  // durante o pending), não só no mount inicial - re-executar apagaria o
  // resultado (e desmontaria o WaveformCanvas, derrubando zoom/seleção/cursor de
  // RF06-I03) por um instante a cada execução. Guardar o último resultado à parte
  // mantém a tela estável enquanto a nova simulação roda.
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const result = lastResult;
  const error = runMutation.error?.message ?? null;
  const isRunning = runMutation.isPending;

  const handleRun = useCallback(() => {
    runMutation.mutate(
      { ...sources, projectId: project?.id },
      {
        onSuccess: (simulation) => {
          setLastResult(simulation);
          if (project) {
            onRecordRun(project.id, {
              kind: simulation.failure ? 'failure' : 'success',
              at: new Date().toISOString(),
            });
          }
        },
      },
    );
  }, [runMutation, sources, project, onRecordRun]);

  /**
   * RF05-I02 - troca de aba e navegação até a linha. Diagnóstico sem `line`
   * ou cujo `file` não bate com nenhum dos dois arquivos do projeto (ex.:
   * diagnóstico do projeto inteiro, sem posição) não navega - o item nem
   * deveria ser clicável nesse caso (ver `ConsolePanel`).
   */
  const focusDiagnostic = useCallback(
    (diagnostic: Diagnostic) => {
      if (diagnostic.line === null) return;
      const file =
        diagnostic.file === sources.testbench.name
          ? sources.testbench.name
          : diagnostic.file === sources.design.name
            ? sources.design.name
            : null;
      if (file === null) return;

      setActiveTab(file === sources.testbench.name ? 'testbench' : 'design');
      setPendingReveal({ file, line: diagnostic.line, column: diagnostic.column });
    },
    [sources.testbench.name, sources.design.name],
  );

  // Espera a troca de aba (e o modelo do Monaco que vem junto) terminar de
  // commitar antes de revelar - chamar revealPosition no mesmo evento do
  // clique ainda pegaria o CodeEditor com o `fileName` antigo.
  useEffect(() => {
    if (!pendingReveal) return;
    codeEditorRef.current?.revealPosition(
      pendingReveal.file,
      pendingReveal.line,
      pendingReveal.column,
    );
    setPendingReveal(null);
  }, [activeTab, pendingReveal]);

  const knownFileNames = [sources.design.name, sources.testbench.name];

  const stepDiagnostic = useCallback(
    (delta: 1 | -1) => {
      const targets = navigableDiagnostics(result?.diagnostics ?? [], [
        sources.design.name,
        sources.testbench.name,
      ]);
      const next = cycleIndex(diagnosticCursorRef.current, delta, targets.length);
      const target = next === null ? undefined : targets[next];
      if (next === null || !target) return;
      diagnosticCursorRef.current = next;
      focusDiagnostic(target);
    },
    [result, sources.design.name, sources.testbench.name, focusDiagnostic],
  );

  /** RF09-I02 - ação de cada atalho; chamada pelo ouvinte global e pelo Monaco. */
  const handleShortcut = useCallback(
    (id: ShortcutId) => {
      switch (id) {
        case 'run':
          if (!isRunning) handleRun();
          break;
        case 'next-diagnostic':
          stepDiagnostic(1);
          break;
        case 'previous-diagnostic':
          stepDiagnostic(-1);
          break;
        case 'leave-editor':
          document
            .querySelector<HTMLElement>('[data-workspace-file-tab][aria-selected="true"]')
            ?.focus();
          break;
        case 'help':
          setShortcutsOpen(true);
          break;
        // 'save' vive em useProjectLink; 'comment' é nativo do Monaco.
        default:
          break;
      }
    },
    [isRunning, handleRun, stepDiagnostic],
  );

  useEffect(() => {
    diagnosticCursorRef.current = null;
  }, [result]);

  useEffect(() => {
    const isMac = isMacPlatform();
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const editable = isEditableTarget(event.target);
      for (const shortcut of SHORTCUTS) {
        if (shortcut.id === 'save' || shortcut.scope === 'editor') continue;
        // Teclas simples (sem modificador) não disparam dentro de campos de texto.
        if (!shortcut.combo.mod && shortcut.combo.key.length === 1 && editable) continue;
        if (!matchesShortcut(event, shortcut.combo, isMac)) continue;
        event.preventDefault();
        handleShortcut(shortcut.id);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleShortcut]);

  function handleRequestOpenProjects() {
    if (isDirty) setLeaveDialogOpen(true);
    else onOpenProjects?.();
  }

  /** RF08 - exporta as fontes ao vivo do editor (não exige salvar antes). */
  function handleExport() {
    if (!project) return;
    try {
      const bytes = buildProjectZip(project, sources);
      downloadProjectZip(bytes, buildExportFileName(project.name, project.id));
    } catch {
      toast.error(EXPORT_ERROR_MESSAGE);
    }
  }

  function handleResetLayout() {
    horizontalGroupRef.current?.setLayout([...DEFAULT_HORIZONTAL_LAYOUT]);
    verticalGroupRef.current?.setLayout([...DEFAULT_VERTICAL_LAYOUT]);
  }

  const activeFile = sources[activeTab];
  const runStatus = buildRunStatus({ result, error, isRunning });
  const filesWithErrors = {
    design: (result?.diagnostics ?? []).some(
      (d) => d.severity === 'error' && d.file === sources.design.name,
    ),
    testbench: (result?.diagnostics ?? []).some(
      (d) => d.severity === 'error' && d.file === sources.testbench.name,
    ),
  };

  return (
    <div className="flex h-full min-w-[1024px] flex-col">
      <WorkspaceHeader
        project={project}
        isDirty={isDirty}
        onSave={save}
        onExport={handleExport}
        onOpenProjects={onOpenProjects && handleRequestOpenProjects}
        onOpenDocs={onOpenDocs}
        onRun={handleRun}
        isRunning={isRunning}
        onResetLayout={handleResetLayout}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <RestoreDraftDialog draft={pendingDraft} onUseDraft={useDraft} onDiscard={discardDraft} />
      <UnsavedChangesDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onDiscard={() => {
          setLeaveDialogOpen(false);
          onOpenProjects?.();
        }}
        onSaveAndLeave={() => {
          save();
          setLeaveDialogOpen(false);
          onOpenProjects?.();
        }}
      />

      <main className="flex min-h-0 flex-1 flex-col">
        <PanelGroup
          ref={horizontalGroupRef}
          direction="horizontal"
          className="flex-1"
          onLayout={(sizes) => saveLayout(HORIZONTAL_LAYOUT_KEY, sizes, DEFAULT_HORIZONTAL_LAYOUT)}
        >
          <Panel
            defaultSize={(initialHorizontal ?? DEFAULT_HORIZONTAL_LAYOUT)[0]}
            minSize={PANEL_MIN_SIZE.EDITOR_COLUMN}
          >
            <PanelGroup
              ref={verticalGroupRef}
              direction="vertical"
              onLayout={(sizes) => saveLayout(VERTICAL_LAYOUT_KEY, sizes, DEFAULT_VERTICAL_LAYOUT)}
            >
              <Panel
                defaultSize={(initialVertical ?? DEFAULT_VERTICAL_LAYOUT)[0]}
                minSize={PANEL_MIN_SIZE.EDITOR}
                className="flex flex-col"
              >
                <FileTabs
                  sources={sources}
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                  idPrefix={idPrefix}
                  filesWithErrors={filesWithErrors}
                  dirtyFiles={dirtyFiles}
                />
                <div
                  role="tabpanel"
                  id={fileTabPanelId(idPrefix)}
                  aria-labelledby={fileTabId(idPrefix, activeTab)}
                  className="min-h-0 flex-1"
                >
                  <CodeEditor
                    ref={codeEditorRef}
                    fileName={activeFile.name}
                    value={activeFile.content}
                    diagnostics={result?.diagnostics ?? []}
                    onChange={(content) => updateFile(activeTab, content)}
                    onShortcut={handleShortcut}
                    onCursorChange={setCursor}
                  />
                </div>
              </Panel>

              <ResizeHandle direction="vertical" label={RESIZE_HANDLE.LABEL_EDITOR_CONSOLE} />

              <Panel
                defaultSize={(initialVertical ?? DEFAULT_VERTICAL_LAYOUT)[1]}
                minSize={PANEL_MIN_SIZE.CONSOLE}
              >
                <ConsolePanel
                  ref={consolePanelRef}
                  result={result}
                  error={error}
                  isRunning={isRunning}
                  onSelectDiagnostic={focusDiagnostic}
                  knownFileNames={knownFileNames}
                />
              </Panel>
            </PanelGroup>
          </Panel>

          <ResizeHandle direction="horizontal" label={RESIZE_HANDLE.LABEL_EDITOR_WAVEFORM} />

          <Panel
            defaultSize={(initialHorizontal ?? DEFAULT_HORIZONTAL_LAYOUT)[1]}
            minSize={PANEL_MIN_SIZE.WAVEFORM}
          >
            <div className="flex h-full flex-col">
              <PanelHeading>Formas de onda</PanelHeading>
              <div className="min-h-0 flex-1">
                <WaveformPanel vcd={result?.vcd ?? null} />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </main>

      <StatusBar
        status={runStatus}
        hasProject={project !== null}
        isDirty={isDirty}
        cursor={cursor}
        onFocusProblems={() => consolePanelRef.current?.focusProblems()}
      />
    </div>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex h-7 items-center border-b bg-muted px-3 text-xs font-medium text-muted-foreground">
      {children}
    </h2>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
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
import { ConsolePanel } from './components/console-panel';
import { RestoreDraftDialog } from './components/restore-draft-dialog';
import { UnsavedChangesDialog } from './components/unsaved-changes-dialog';
import { WaveformPanel } from './components/waveform-panel';
import { WorkspaceHeader } from './components/workspace-header';
import { useProjectLink, type WorkspaceFile } from './hooks/use-project-link';
import { useRunSimulation } from './hooks/use-run-simulation';
import { EXPORT_ERROR_MESSAGE } from './utils/messages';

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
  const { sources, updateFile, isDirty, save, pendingDraft, useDraft, discardDraft } =
    useProjectLink(project, onSaveProject, overrideSources);
  const [activeTab, setActiveTab] = useState<WorkspaceFile>('design');
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const runMutation = useRunSimulation();
  const codeEditorRef = useRef<CodeEditorHandle>(null);
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
          if (simulation.failure) toast.error('A simulação terminou com erros.');
          else toast.success(`Simulação concluída em ${simulation.durationMs} ms.`);
        },
        onError: (cause) => toast.error(cause.message),
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

  const activeFile = sources[activeTab];

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
      />

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

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={58} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={70} minSize={30} className="flex flex-col">
              <div role="tablist" aria-label="Arquivos do projeto" className="flex border-b">
                {(['design', 'testbench'] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    type="button"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'border-r px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      activeTab === tab
                        ? 'bg-background font-medium'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {sources[tab].name}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1">
                <CodeEditor
                  ref={codeEditorRef}
                  fileName={activeFile.name}
                  value={activeFile.content}
                  diagnostics={result?.diagnostics ?? []}
                  onChange={(content) => updateFile(activeTab, content)}
                />
              </div>
            </Panel>

            <ResizeHandle direction="vertical" />

            <Panel defaultSize={30} minSize={15}>
              <PanelHeading>Console</PanelHeading>
              <div className="h-[calc(100%-1.75rem)]">
                <ConsolePanel
                  result={result}
                  error={error}
                  isRunning={isRunning}
                  onSelectDiagnostic={focusDiagnostic}
                  knownFileNames={[sources.design.name, sources.testbench.name]}
                />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandle direction="horizontal" />

        <Panel defaultSize={42} minSize={20}>
          <PanelHeading>Formas de onda</PanelHeading>
          <div className="h-[calc(100%-1.75rem)]">
            <WaveformPanel vcd={result?.vcd ?? null} />
          </div>
        </Panel>
      </PanelGroup>
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

function ResizeHandle({ direction }: { direction: 'horizontal' | 'vertical' }) {
  return (
    <PanelResizeHandle
      className={cn(
        'bg-border transition-colors data-[resize-handle-state=drag]:bg-ring hover:bg-ring',
        direction === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
      )}
    />
  );
}

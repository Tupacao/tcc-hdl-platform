import { useCallback, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CircuitBoard, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import type { Diagnostic, HdlSources, SimulationResult } from '@tplab/shared';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { SAMPLE_SOURCES } from '@/lib/samples';
import { cn } from '@/lib/utils';
import { CodeEditor } from './code-editor';
import { ConsolePanel } from './console-panel';
import { useRunSimulation } from './hooks/use-run-simulation';
import { WaveformPanel } from './waveform-panel';

type FileTab = 'design' | 'testbench';

/**
 * RF09 — editor, compilador, simulador e visualizador em uma unica interface.
 * Os painies sao redimensionaveis para caber em telas a partir de 1024px (RNF03).
 */
export function Workspace() {
  const [sources, setSources] = useState<HdlSources>(SAMPLE_SOURCES);
  const [activeTab, setActiveTab] = useState<FileTab>('design');
  const runMutation = useRunSimulation();
  // `useMutation` limpa `data` assim que uma nova chamada comeca (fica undefined
  // durante o pending), nao so no mount inicial - re-executar apagaria o
  // resultado (e desmontaria o WaveformCanvas, derrubando zoom/selecao/cursor de
  // RF06-I03) por um instante a cada execucao. Guardar o ultimo resultado a parte
  // mantem a tela estavel enquanto a nova simulacao roda.
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const result = lastResult;
  const error = runMutation.error?.message ?? null;
  const isRunning = runMutation.isPending;

  const updateFile = useCallback((tab: FileTab, content: string) => {
    setSources((current) => ({ ...current, [tab]: { ...current[tab], content } }));
  }, []);

  const handleRun = useCallback(() => {
    runMutation.mutate(sources, {
      onSuccess: (simulation) => {
        setLastResult(simulation);
        if (simulation.failure) toast.error('A simulacao terminou com erros.');
        else toast.success(`Simulacao concluida em ${simulation.durationMs} ms.`);
      },
      onError: (cause) => toast.error(cause.message),
    });
  }, [runMutation, sources]);

  const focusDiagnostic = useCallback(
    (diagnostic: Diagnostic) => {
      if (diagnostic.file === sources.testbench.name) setActiveTab('testbench');
      else setActiveTab('design');
    },
    [sources.testbench.name],
  );

  const activeFile = sources[activeTab];

  return (
    <div className="flex h-full min-w-[1024px] flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <CircuitBoard aria-hidden className="size-5" />
        <h1 className="text-sm font-semibold">TPLab</h1>
        <span className="text-xs text-muted-foreground">Verilog</span>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleRun} disabled={isRunning} size="sm">
            {isRunning ? <Loader2 aria-hidden className="animate-spin" /> : <Play aria-hidden />}
            {isRunning ? 'Executando' : 'Executar'}
          </Button>
          <ThemeToggle />
        </div>
      </header>

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

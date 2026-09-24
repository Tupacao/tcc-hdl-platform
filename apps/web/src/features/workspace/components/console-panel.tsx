import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { Diagnostic, SimulationResult } from '@tplab/shared';
import { cn } from '@/lib/utils';
import {
  badgeTone,
  countDiagnostics,
  defaultConsoleTab,
  type ConsoleTab,
} from '../utils/console-tabs';
import { CONSOLE_EMPTY_STATE, CONSOLE_RUNNING_MESSAGE, CONSOLE_TABS } from '../utils/messages';
import { formatCombo, getShortcut, isMacPlatform } from '../utils/shortcuts';
import { ProblemsList } from './problems-list';

interface ConsolePanelProps {
  result: SimulationResult | null;
  error: string | null;
  isRunning: boolean;
  onSelectDiagnostic: (diagnostic: Diagnostic) => void;
  /** RF05-I02 - nomes dos dois arquivos do projeto; decide se um diagnóstico é navegável. */
  knownFileNames: string[];
}

/** RF09-I03 - a barra de estado leva o usuário direto à lista de problemas. */
export interface ConsolePanelHandle {
  focusProblems: () => void;
}

const FAILURE_LABELS: Record<NonNullable<SimulationResult['failure']>, string> = {
  compile_error: 'Erro de compilação',
  runtime_error: 'Erro durante a simulação',
  timeout: 'Tempo limite excedido',
  memory_limit: 'Limite de memória excedido',
  internal_error: 'Erro interno da plataforma',
};

const TAB_ORDER: ConsoleTab[] = ['console', 'problems'];

/**
 * Painel inferior com as abas "Console" (saída bruta do iverilog/vvp) e
 * "Problemas" (a mesma informação estruturada e traduzida) - RF05, Figma 2.3 e
 * 4.1. As duas coexistem de propósito: quem aprende precisa da versão traduzida,
 * mas também ver que existe uma saída real por trás dela.
 */
export const ConsolePanel = forwardRef<ConsolePanelHandle, ConsolePanelProps>(function ConsolePanel(
  { result, error, isRunning, onSelectDiagnostic, knownFileNames },
  ref,
) {
  const baseId = useId();
  const [tab, setTab] = useState<ConsoleTab>('console');

  useImperativeHandle(
    ref,
    () => ({
      focusProblems: () => {
        setTab('problems');
        // O botão da aba já existe no DOM; o painel troca na próxima renderização.
        document.getElementById(`${baseId}-tab-problems`)?.focus();
      },
    }),
    [baseId],
  );

  // Depois de cada execução: com erros ou avisos abre Problemas; sem nenhum, Console.
  useEffect(() => {
    if (result) setTab(defaultConsoleTab(result));
  }, [result]);

  const counts = countDiagnostics(result?.diagnostics ?? []);
  const tone = badgeTone(counts);

  function handleTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TAB_ORDER.indexOf(tab);
    let next: ConsoleTab | null = null;
    if (event.key === 'ArrowRight') next = TAB_ORDER[(index + 1) % TAB_ORDER.length] ?? null;
    else if (event.key === 'ArrowLeft')
      next = TAB_ORDER[(index - 1 + TAB_ORDER.length) % TAB_ORDER.length] ?? null;
    else if (event.key === 'Home') next = TAB_ORDER[0] ?? null;
    else if (event.key === 'End') next = TAB_ORDER[TAB_ORDER.length - 1] ?? null;
    if (next === null) return;

    event.preventDefault();
    setTab(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  }

  function renderBody(): ReactNode {
    if (isRunning) return <Empty>{CONSOLE_RUNNING_MESSAGE}</Empty>;
    if (error) return <Empty tone="error">{error}</Empty>;
    if (tab === 'problems') {
      return (
        <ProblemsList
          diagnostics={result?.diagnostics ?? null}
          ranToCompletion={result !== null && result.failure === null}
          onSelectDiagnostic={onSelectDiagnostic}
          knownFileNames={knownFileNames}
        />
      );
    }
    return <ConsoleOutput result={result} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div
        role="tablist"
        aria-label={CONSOLE_TABS.LABEL}
        onKeyDown={handleTabsKeyDown}
        className="flex h-7 shrink-0 items-center gap-1 border-b bg-muted px-2"
      >
        <TabButton
          id={`${baseId}-tab-console`}
          panelId={`${baseId}-panel`}
          selected={tab === 'console'}
          onSelect={() => setTab('console')}
        >
          {CONSOLE_TABS.CONSOLE}
        </TabButton>
        <TabButton
          id={`${baseId}-tab-problems`}
          panelId={`${baseId}-panel`}
          selected={tab === 'problems'}
          onSelect={() => setTab('problems')}
        >
          {CONSOLE_TABS.PROBLEMS}
          <span
            className={cn(
              'ml-1.5 rounded-[5px] px-1.5 font-mono text-[10px] font-bold',
              tone === 'error' && 'bg-destructive/15 text-destructive',
              tone === 'warning' && 'bg-warning/15 text-warning',
              tone === 'neutral' && 'bg-background text-muted-foreground',
            )}
          >
            {counts.errors + counts.warnings}
          </span>
        </TabButton>
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${tab}`}
        tabIndex={tab === 'console' ? 0 : undefined}
        className="min-h-0 flex-1 overflow-auto"
      >
        {renderBody()}
      </div>
    </div>
  );
});

function TabButton({
  id,
  panelId,
  selected,
  onSelect,
  children,
}: {
  id: string;
  panelId: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'flex h-full items-center border-b-2 px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/** Aba "Console": saída bruta da toolchain, sem tradução, mais o stdout do testbench. */
function ConsoleOutput({ result }: { result: SimulationResult | null }) {
  if (!result) {
    const isMac = isMacPlatform();
    const keys = formatCombo(getShortcut('run').combo, isMac).join(isMac ? '' : '+');
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
        <p className="text-sm font-medium">{CONSOLE_EMPTY_STATE.TITLE}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {CONSOLE_EMPTY_STATE.HINT_PREFIX}
          {keys}
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 font-mono text-xs leading-relaxed">
      {result.diagnostics.map((diagnostic, index) => (
        <p
          key={`${diagnostic.raw}-${index}`}
          className={diagnostic.severity === 'error' ? 'text-destructive' : 'text-warning'}
        >
          {diagnostic.raw}
        </p>
      ))}

      {result.stdout && <pre className="whitespace-pre-wrap">{result.stdout}</pre>}

      {result.failure ? (
        <p className="mt-2 font-sans text-sm font-medium text-destructive">
          {FAILURE_LABELS[result.failure]}
        </p>
      ) : (
        <p className="mt-2 text-success">
          <span aria-hidden>✓ </span>
          <span className="font-sans">Concluído em {result.durationMs} ms</span>
        </p>
      )}
    </div>
  );
}

function Empty({ children, tone }: { children: ReactNode; tone?: 'error' }) {
  return (
    <p
      className={cn('p-4 text-sm', tone === 'error' ? 'text-destructive' : 'text-muted-foreground')}
    >
      {children}
    </p>
  );
}

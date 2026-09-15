import type { Diagnostic, SimulationResult } from '@tplab/shared';
import { cn } from '@/lib/utils';

interface ConsolePanelProps {
  result: SimulationResult | null;
  error: string | null;
  isRunning: boolean;
  onSelectDiagnostic: (diagnostic: Diagnostic) => void;
}

const FAILURE_LABELS: Record<NonNullable<SimulationResult['failure']>, string> = {
  compile_error: 'Erro de compilação',
  runtime_error: 'Erro durante a simulação',
  timeout: 'Tempo limite excedido',
  memory_limit: 'Limite de memória excedido',
  internal_error: 'Erro interno da plataforma',
};

/** Console de saída: diagnósticos contextualizados (RF05) e stdout do testbench. */
export function ConsolePanel({ result, error, isRunning, onSelectDiagnostic }: ConsolePanelProps) {
  if (isRunning) {
    return <Empty>Compilando e simulando...</Empty>;
  }

  if (error) {
    return <Empty tone="error">{error}</Empty>;
  }

  if (!result) {
    return <Empty>Execute a simulação para ver a saída aqui.</Empty>;
  }

  return (
    <div className="h-full overflow-auto p-3 font-mono text-xs leading-relaxed">
      {result.failure && (
        <p className="mb-2 font-sans text-sm font-medium text-destructive">
          {FAILURE_LABELS[result.failure]}
        </p>
      )}

      {result.diagnostics.length > 0 && (
        <ul className="mb-3 space-y-1">
          {result.diagnostics.map((diagnostic, index) => (
            <li key={`${diagnostic.raw}-${index}`}>
              <button
                type="button"
                onClick={() => onSelectDiagnostic(diagnostic)}
                disabled={diagnostic.line === null}
                className={cn(
                  'w-full rounded px-2 py-1 text-left hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent',
                  diagnostic.severity === 'error' ? 'text-destructive' : 'text-warning',
                )}
              >
                {diagnostic.line !== null && (
                  <span className="mr-2 opacity-70">
                    {diagnostic.file}:{diagnostic.line}
                  </span>
                )}
                {diagnostic.message}
              </button>
            </li>
          ))}
        </ul>
      )}

      {result.stdout && <pre className="whitespace-pre-wrap">{result.stdout}</pre>}

      {!result.failure && (
        <p className="mt-3 font-sans text-xs text-muted-foreground">
          Concluído em {result.durationMs} ms
        </p>
      )}
    </div>
  );
}

function Empty({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <p
      className={cn('p-4 text-sm', tone === 'error' ? 'text-destructive' : 'text-muted-foreground')}
    >
      {children}
    </p>
  );
}

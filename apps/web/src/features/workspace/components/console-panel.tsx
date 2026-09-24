import { CircleX, TriangleAlert } from 'lucide-react';
import type { Diagnostic, SimulationResult } from '@tplab/shared';
import { cn } from '@/lib/utils';
import { sortDiagnosticsByLineDesc } from '../utils/sort-diagnostics';

interface ConsolePanelProps {
  result: SimulationResult | null;
  error: string | null;
  isRunning: boolean;
  onSelectDiagnostic: (diagnostic: Diagnostic) => void;
  /** RF05-I02 - nomes dos dois arquivos do projeto; decide se um diagnóstico é navegável. */
  knownFileNames: string[];
}

const FAILURE_LABELS: Record<NonNullable<SimulationResult['failure']>, string> = {
  compile_error: 'Erro de compilação',
  runtime_error: 'Erro durante a simulação',
  timeout: 'Tempo limite excedido',
  memory_limit: 'Limite de memória excedido',
  internal_error: 'Erro interno da plataforma',
};

const DIAGNOSTIC_SEPARATOR = ' · ';

const SEVERITY_LABEL: Record<Diagnostic['severity'], string> = {
  error: 'erro',
  warning: 'aviso',
};

/** Console de saída: diagnósticos contextualizados (RF05) e stdout do testbench. */
export function ConsolePanel({
  result,
  error,
  isRunning,
  onSelectDiagnostic,
  knownFileNames,
}: ConsolePanelProps) {
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
        <ul
          aria-label="Diagnósticos"
          className="mb-3 flex flex-col gap-1"
          onKeyDown={handleListKeyDown}
        >
          {sortDiagnosticsByLineDesc(result.diagnostics).map((diagnostic, index) => (
            <DiagnosticItem
              key={`${diagnostic.raw}-${index}`}
              diagnostic={diagnostic}
              isNavigable={diagnostic.line !== null && knownFileNames.includes(diagnostic.file)}
              onSelect={() => onSelectDiagnostic(diagnostic)}
            />
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

/** Setas cima/baixo movem o foco entre itens navegáveis, com retorno ao extremo oposto (RF05-I02). */
function handleListKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();

  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
  );
  if (items.length === 0) return;

  const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
  const delta = event.key === 'ArrowDown' ? 1 : -1;
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + delta + items.length) % items.length;
  items[nextIndex]?.focus();
}

function formatLocation(diagnostic: Diagnostic): string {
  if (diagnostic.file === '') return 'projeto';
  if (diagnostic.line === null) return diagnostic.file;
  return diagnostic.column
    ? `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}`
    : `${diagnostic.file}:${diagnostic.line}`;
}

function DiagnosticItem({
  diagnostic,
  isNavigable,
  onSelect,
}: {
  diagnostic: Diagnostic;
  isNavigable: boolean;
  onSelect: () => void;
}) {
  const Icon = diagnostic.severity === 'error' ? CircleX : TriangleAlert;
  const location = formatLocation(diagnostic);
  // Com explicação (RF05-I03), a manchete em português vem primeiro e a mensagem
  // original da ferramenta continua visível como informação secundária.
  const headline = diagnostic.title ?? diagnostic.message;
  const hasExplanation = diagnostic.title !== null;
  const ariaLabel = isNavigable
    ? `${SEVERITY_LABEL[diagnostic.severity]}, ${headline}, ${diagnostic.file}, linha ${diagnostic.line}`
    : `${SEVERITY_LABEL[diagnostic.severity]}, ${headline}, sem posição no código`;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={!isNavigable}
        aria-label={ariaLabel}
        className={cn(
          'flex w-full items-start gap-3 rounded-md border-l-[3px] px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isNavigable
            ? cn(
                'cursor-pointer hover:brightness-110',
                diagnostic.severity === 'error'
                  ? 'border-destructive bg-destructive/10'
                  : 'border-warning bg-warning/10',
              )
            : 'cursor-default border-muted-foreground/40 bg-muted/30',
        )}
      >
        <span className="flex w-48 shrink-0 items-center gap-2 pt-0.5">
          <Icon
            aria-hidden
            className={cn(
              'size-3.5 shrink-0',
              diagnostic.severity === 'error' ? 'text-destructive' : 'text-warning',
            )}
          />
          <span
            className={cn(
              'truncate font-mono text-[11px]',
              isNavigable ? 'text-muted-foreground' : 'text-muted-foreground/70',
            )}
          >
            {location}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block',
              diagnostic.title ? 'font-sans text-xs font-medium' : 'font-mono',
              !isNavigable && 'text-muted-foreground',
            )}
          >
            {headline}
          </span>
          {hasExplanation && (
            <span className="mt-0.5 block font-sans text-[11px] text-muted-foreground">
              {diagnostic.hint}
              {diagnostic.hint && DIAGNOSTIC_SEPARATOR}
              <span className="font-mono">{diagnostic.message}</span>
            </span>
          )}
        </span>
        {isNavigable ? (
          <span className="shrink-0 rounded-md border bg-background px-2 py-1 font-sans text-[11px] whitespace-nowrap text-foreground">
            Ir para a linha
          </span>
        ) : (
          <span className="shrink-0 pt-0.5 font-mono text-[10px] whitespace-nowrap text-muted-foreground/70">
            sem posição no código
          </span>
        )}
      </button>
    </li>
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

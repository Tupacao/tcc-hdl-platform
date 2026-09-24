import { CircleX, TriangleAlert } from 'lucide-react';
import type { Diagnostic } from '@tplab/shared';
import { cn } from '@/lib/utils';
import { countDiagnostics } from '../utils/console-tabs';
import { PROBLEMS_PANEL } from '../utils/messages';
import { sortDiagnosticsByLineDesc } from '../utils/sort-diagnostics';

interface ProblemsListProps {
  /** `null` quando ainda não houve execução. */
  diagnostics: Diagnostic[] | null;
  /** `true` quando a execução chegou ao fim sem falha (habilita a confirmação "rodou normalmente"). */
  ranToCompletion: boolean;
  onSelectDiagnostic: (diagnostic: Diagnostic) => void;
  /** RF05-I02 - nomes dos dois arquivos do projeto; decide se um diagnóstico é navegável. */
  knownFileNames: string[];
}

const DIAGNOSTIC_SEPARATOR = ' · ';

const SEVERITY_LABEL: Record<Diagnostic['severity'], string> = {
  error: 'erro',
  warning: 'aviso',
};

/** Aba "Problemas": diagnósticos estruturados, com a explicação em português (RF05, Figma 2.3). */
export function ProblemsList({
  diagnostics,
  ranToCompletion,
  onSelectDiagnostic,
  knownFileNames,
}: ProblemsListProps) {
  if (diagnostics === null) {
    return <p className="p-4 text-sm text-muted-foreground">{PROBLEMS_PANEL.EMPTY_NOT_RUN}</p>;
  }

  const { errors } = countDiagnostics(diagnostics);
  const showAllClear = ranToCompletion && errors === 0;

  return (
    <div className="p-3">
      {diagnostics.length === 0 ? (
        <p className="pb-2 text-sm text-muted-foreground">{PROBLEMS_PANEL.EMPTY_NO_PROBLEMS}</p>
      ) : (
        <>
          <div
            aria-hidden
            className="mb-1 flex gap-3 border-l-[3px] border-transparent px-3 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
          >
            <span className="w-48 shrink-0">{PROBLEMS_PANEL.COLUMN_LOCATION}</span>
            <span>{PROBLEMS_PANEL.COLUMN_MESSAGE}</span>
          </div>
          <ul
            aria-label={PROBLEMS_PANEL.LIST_LABEL}
            className="flex flex-col gap-1"
            onKeyDown={handleListKeyDown}
          >
            {sortDiagnosticsByLineDesc(diagnostics).map((diagnostic, index) => (
              <DiagnosticItem
                key={`${diagnostic.raw}-${index}`}
                diagnostic={diagnostic}
                isNavigable={diagnostic.line !== null && knownFileNames.includes(diagnostic.file)}
                onSelect={() => onSelectDiagnostic(diagnostic)}
              />
            ))}
          </ul>
        </>
      )}

      {showAllClear && (
        <p className="mt-3 inline-block rounded-md border border-success/40 bg-success/10 px-2.5 py-1 font-mono text-[11px] text-success">
          <span aria-hidden>✓ </span>
          {PROBLEMS_PANEL.ALL_CLEAR}
        </p>
      )}

      {diagnostics.length > 0 && (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          {PROBLEMS_PANEL.FOOTER_HINT}
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
    : `${SEVERITY_LABEL[diagnostic.severity]}, ${headline}, ${PROBLEMS_PANEL.NO_POSITION}`;

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
              hasExplanation ? 'font-sans text-xs font-medium' : 'font-mono text-xs',
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
            {PROBLEMS_PANEL.GO_TO_LINE}
          </span>
        ) : (
          <span className="shrink-0 pt-0.5 font-mono text-[10px] whitespace-nowrap text-muted-foreground/70">
            {PROBLEMS_PANEL.NO_POSITION}
          </span>
        )}
      </button>
    </li>
  );
}

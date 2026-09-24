import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_BAR, formatCursorPosition } from '../utils/messages';
import { announcementFor, type RunStatus } from '../utils/run-status';

interface StatusBarProps {
  status: RunStatus;
  /** `false` no rascunho anônimo (RF20): não há projeto para estar "salvo" ou "não salvo". */
  hasProject: boolean;
  isDirty: boolean;
  /** Posição do cursor no editor; `null` até o editor montar. */
  cursor: { line: number; column: number } | null;
  /** Leva ao console, na aba Problemas. */
  onFocusProblems: () => void;
}

/**
 * Barra de estado do rodapé (RF09-I03, Figma 2.1 e 2.3): desfecho da última
 * execução, duração e contagem de erros/avisos - visíveis de qualquer painel -,
 * mais linguagem, cursor e estado do projeto. É o único ponto de anúncio do
 * desfecho para leitor de tela (a região `role="status"` abaixo).
 */
export function StatusBar({
  status,
  hasProject,
  isDirty,
  cursor,
  onFocusProblems,
}: StatusBarProps) {
  const finished = status.kind === 'success' || status.kind === 'failure';

  return (
    <footer
      aria-label={STATUS_BAR.LABEL}
      className="flex h-7 shrink-0 items-center justify-between gap-4 border-t bg-muted px-4 text-[11px]"
    >
      <span role="status" aria-live="polite" aria-atomic className="sr-only">
        {finished ? announcementFor(status) : ''}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex items-center gap-1.5 font-medium',
            status.kind === 'success' && 'text-success',
            status.kind === 'failure' && 'text-destructive',
            (status.kind === 'idle' || status.kind === 'running') && 'text-muted-foreground',
          )}
        >
          {status.kind === 'success' && <Check aria-hidden className="size-3" />}
          {status.kind === 'failure' && <X aria-hidden className="size-3" />}
          {status.label}
        </span>

        {status.duration && (
          <span className="font-mono text-muted-foreground">{status.duration}</span>
        )}
        {status.counts && (
          <>
            <Separator />
            <button
              type="button"
              onClick={onFocusProblems}
              title={STATUS_BAR.FOCUS_PROBLEMS}
              className="rounded-sm font-mono text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {status.counts}
            </button>
          </>
        )}
        {status.detail && (
          <>
            <Separator />
            <span className="truncate font-mono text-muted-foreground">{status.detail}</span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 font-mono text-muted-foreground">
        <span>{STATUS_BAR.LANGUAGE}</span>
        <Separator />
        <span>{STATUS_BAR.ENCODING}</span>
        {cursor && (
          <>
            <Separator />
            <span>{formatCursorPosition(cursor.line, cursor.column)}</span>
          </>
        )}
        {hasProject && (
          <>
            <Separator />
            <span>{isDirty ? STATUS_BAR.UNSAVED : STATUS_BAR.ALL_SAVED}</span>
          </>
        )}
      </div>
    </footer>
  );
}

function Separator() {
  return <span aria-hidden className="h-3 w-px bg-border" />;
}

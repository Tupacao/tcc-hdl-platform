import type { SimulationResult } from '@tplab/shared';
import { countDiagnostics } from './console-tabs';

/** Estado da última execução exibido na barra de estado (RF09-I03, Figma 2.1, 2.3 e 2.4). */
export type RunStatusKind = 'idle' | 'queued' | 'running' | 'success' | 'failure';

export interface RunStatus {
  kind: RunStatusKind;
  /** Texto do desfecho, ex.: "Executado sem erros" ou "Falhou na compilação". */
  label: string;
  /** Duração formatada (ex.: "0,41 s") ou `null` quando não há medição. */
  duration: string | null;
  /** Contagem formatada (ex.: "0 erros · 1 aviso") ou `null` quando não há resultado. */
  counts: string | null;
  /** Complemento do desfecho (ex.: "simulação não executada") ou `null`. */
  detail: string | null;
}

export const RUN_STATUS_LABELS = {
  IDLE: 'Nenhuma execução ainda',
  QUEUED: 'Na fila',
  QUEUED_WAITING: 'aguardando um executor livre',
  RUNNING: 'Executando…',
  SUCCESS: 'Executado sem erros',
  REQUEST_FAILED: 'Falha ao executar',
  /** RF03-I02, Figma 4.2 · Limite de uso atingido (429). */
  RATE_LIMITED: 'Limite de uso atingido',
  /** RF03-I02, Figma 2.4 · Executor indisponível (503 — fila cheia ou Redis fora do ar). */
  SERVICE_UNAVAILABLE: 'Não foi possível executar',
  SERVICE_UNAVAILABLE_DETAIL: 'problema no servidor',
  COMPILE_ERROR_DETAIL: 'simulação não executada',
  FAILURES: {
    compile_error: 'Falhou na compilação',
    runtime_error: 'Erro durante a simulação',
    timeout: 'Tempo limite excedido',
    memory_limit: 'Limite de memória excedido',
    internal_error: 'Erro interno da plataforma',
  } satisfies Record<NonNullable<SimulationResult['failure']>, string>,
};

/** `410` → `"0,41 s"`; vírgula decimal, como no Figma. */
export function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(2).replace('.', ',')} s`;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** `{1, 1}` → `"1 erro · 1 aviso"`. */
export function formatCounts(errors: number, warnings: number): string {
  return `${plural(errors, 'erro', 'erros')} · ${plural(warnings, 'aviso', 'avisos')}`;
}

interface RunStatusInput {
  result: SimulationResult | null;
  /** Mensagem quando a requisição em si falhou (rede, 429, 400), sem resultado da toolchain. */
  error: string | null;
  /** Status HTTP da falha da requisição (RF03-I02), para diferenciar 429/503 de rede; `null` fora de `error`. */
  errorStatus: number | null;
  isRunning: boolean;
  /** `true` enquanto o job está `queued` (RF03-I02) — a submissão foi aceita, mas nenhum executor a pegou ainda. */
  queued: boolean;
  /** Posição (1-based) na fila; `null` fora do status `queued` ou quando ainda não calculada. */
  queuePosition: number | null;
}

export function buildRunStatus({
  result,
  error,
  errorStatus,
  isRunning,
  queued,
  queuePosition,
}: RunStatusInput): RunStatus {
  if (isRunning) {
    if (queued) {
      return {
        kind: 'queued',
        label: RUN_STATUS_LABELS.QUEUED,
        duration: null,
        counts: null,
        detail:
          queuePosition !== null ? `posição ${queuePosition}` : RUN_STATUS_LABELS.QUEUED_WAITING,
      };
    }
    return {
      kind: 'running',
      label: RUN_STATUS_LABELS.RUNNING,
      duration: null,
      counts: null,
      detail: null,
    };
  }
  if (error) {
    if (errorStatus === 429) {
      return {
        kind: 'failure',
        label: RUN_STATUS_LABELS.RATE_LIMITED,
        duration: null,
        counts: null,
        detail: error,
      };
    }
    if (errorStatus === 503) {
      return {
        kind: 'failure',
        label: RUN_STATUS_LABELS.SERVICE_UNAVAILABLE,
        duration: null,
        counts: null,
        detail: RUN_STATUS_LABELS.SERVICE_UNAVAILABLE_DETAIL,
      };
    }
    return {
      kind: 'failure',
      label: RUN_STATUS_LABELS.REQUEST_FAILED,
      duration: null,
      counts: null,
      detail: null,
    };
  }
  if (!result) {
    return {
      kind: 'idle',
      label: RUN_STATUS_LABELS.IDLE,
      duration: null,
      counts: null,
      detail: null,
    };
  }

  const { errors, warnings } = countDiagnostics(result.diagnostics);
  return {
    kind: result.failure ? 'failure' : 'success',
    label: result.failure ? RUN_STATUS_LABELS.FAILURES[result.failure] : RUN_STATUS_LABELS.SUCCESS,
    duration: formatDuration(result.durationMs),
    counts: formatCounts(errors, warnings),
    detail: result.failure === 'compile_error' ? RUN_STATUS_LABELS.COMPILE_ERROR_DETAIL : null,
  };
}

/** Texto único lido pelo leitor de tela a cada desfecho (a região `aria-live` da barra). */
export function announcementFor(status: RunStatus): string {
  return [status.label, status.duration, status.counts, status.detail]
    .filter((part): part is string => part !== null)
    .join(', ');
}

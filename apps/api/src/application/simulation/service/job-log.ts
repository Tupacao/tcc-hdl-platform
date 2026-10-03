import type { HdlSources, TruncatedFlags } from '@tplab/shared';
import type {
  SandboxOutcome,
  SandboxTimings,
} from '../../../domain/simulation/entities/sandbox.js';

export interface JobLogRecord {
  jobId: string;
  durationMs: number;
  failure: string | null;
  exitCode: number;
  vcdBytes: number;
  sourceBytes: number;
  /** `null` quando `processedAt` ainda nao foi setado pelo BullMQ. */
  queueWaitMs: number | null;
  timings: SandboxTimings;
  /** RF04-I02 — quais artefatos vieram cortados por teto de tamanho. */
  truncated: TruncatedFlags;
  /** RNF05-I01 — estouro de memoria confirmado pelo Docker, e etapa em que o tempo estourou. */
  oomKilled: boolean;
  timeoutPhase: string | null;
  logsUnavailable: boolean;
}

export interface JobLogInput {
  jobId: string;
  sources: Pick<HdlSources, 'design' | 'testbench'>;
  outcome: SandboxOutcome;
  /** `job.timestamp` — quando o job foi enfileirado, epoch ms. */
  queuedAt: number;
  /** `job.processedOn` — quando um worker comecou a processar, epoch ms. */
  processedAt: number | undefined;
}

/**
 * Monta a linha de log estruturado emitida pelo worker por job (RF03-I04).
 * Pura e testavel sem Docker. Nunca inclui o texto do `.vcd`/`stdout`/`stderr`
 * nem o codigo submetido — so tamanhos, para nao vazar o que o aluno escreveu
 * nem inflar o log da VM.
 */
export function buildJobLogRecord(input: JobLogInput): JobLogRecord {
  return {
    jobId: input.jobId,
    durationMs: input.outcome.durationMs,
    failure: input.outcome.failure,
    exitCode: input.outcome.exitCode,
    vcdBytes: input.outcome.vcd?.length ?? 0,
    sourceBytes: input.sources.design.content.length + input.sources.testbench.content.length,
    queueWaitMs: input.processedAt !== undefined ? input.processedAt - input.queuedAt : null,
    timings: input.outcome.timings,
    truncated: input.outcome.truncated,
    oomKilled: input.outcome.oomKilled,
    timeoutPhase: input.outcome.timeoutPhase,
    logsUnavailable: input.outcome.logsUnavailable,
  };
}

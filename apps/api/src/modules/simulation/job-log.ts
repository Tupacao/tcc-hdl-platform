import type { HdlSources } from '@tplab/shared';
import type { SandboxOutcome, SandboxTimings } from './sandbox.js';

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
  };
}

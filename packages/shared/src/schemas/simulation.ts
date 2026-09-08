import { z } from 'zod';
import { HdlSourcesSchema } from './hdl.js';
import { IdSchema, IsoDateSchema } from './common.js';

/**
 * Diagnostico extraido da saida do `iverilog`, ja contextualizado com a linha
 * correspondente do arquivo submetido (RF05).
 */
export const DiagnosticSchema = z.object({
  severity: z.enum(['error', 'warning']),
  file: z.string(),
  line: z.number().int().positive().nullable(),
  column: z.number().int().positive().nullable(),
  message: z.string(),
  /** Linha original emitida pela toolchain, preservada para depuracao. */
  raw: z.string(),
});

/** Estados do job na fila de compilacao/simulacao (BullMQ). */
export const JobStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed']);

/** Motivo da falha, para o frontend diferenciar erro do usuario de erro da plataforma. */
export const SimulationFailureSchema = z.enum([
  'compile_error',
  'runtime_error',
  'timeout',
  'memory_limit',
  'internal_error',
]);

/** Corpo do POST /api/simulations (RF03/RF04). */
export const CompileRequestSchema = HdlSourcesSchema.extend({
  /** Referencia opcional ao projeto salvo que originou a submissao. */
  projectId: IdSchema.optional(),
});

/** Resposta imediata do enfileiramento: o cliente faz polling do job. */
export const SimulationJobSchema = z.object({
  jobId: IdSchema,
  status: JobStatusSchema,
  createdAt: IsoDateSchema,
});

/** Resultado final da execucao no sandbox. */
export const SimulationResultSchema = z.object({
  jobId: IdSchema,
  status: JobStatusSchema,
  failure: SimulationFailureSchema.nullable(),
  diagnostics: z.array(DiagnosticSchema),
  /** stdout do `vvp` — inclui $display do testbench. */
  stdout: z.string(),
  stderr: z.string(),
  /** Conteudo do arquivo .vcd gerado, para o visualizador de ondas (RF06). */
  vcd: z.string().nullable(),
  /** Tempo total de execucao no sandbox, em ms (RNF07: alvo < 5000). */
  durationMs: z.number().int().nonnegative(),
  finishedAt: IsoDateSchema.nullable(),
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type SimulationFailure = z.infer<typeof SimulationFailureSchema>;
export type CompileRequest = z.infer<typeof CompileRequestSchema>;
export type SimulationJob = z.infer<typeof SimulationJobSchema>;
export type SimulationResult = z.infer<typeof SimulationResultSchema>;

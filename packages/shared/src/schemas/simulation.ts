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
  /**
   * Manchete curta em português para os erros frequentes de iniciante
   * (RF05-I03) — `null` quando nenhuma regra do catálogo bate com a mensagem.
   */
  title: z.string().nullable(),
  /**
   * Explicação e próxima ação em português (RF05-I03) — `null` quando nenhuma
   * regra bate. Nunca substitui `message`: o console mantém a mensagem original
   * visível como informação secundária.
   */
  hint: z.string().nullable(),
});

/** Estados do job na fila de compilacao/simulacao (BullMQ). */
export const JobStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed']);

/**
 * Quais artefatos vieram cortados por teto de tamanho (RF04-I02) — flag
 * estruturada em vez de a interface ter que adivinhar pelo conteudo.
 */
export const TruncatedFlagsSchema = z.object({
  stdout: z.boolean(),
  stderr: z.boolean(),
  vcd: z.boolean(),
});

/**
 * Tempo de cada etapa do servidor, em ms (RNF07-I01) — o cliente soma o que o servidor mediu e
 * atribui o resto (rede, polling, renderizacao) a si mesmo. `null` quando a etapa nao existiu
 * ou nao terminou (ex.: sem compilacao concluida).
 */
export const SimulationTimingsSchema = z.object({
  /** Espera na fila: `processedOn - timestamp` do BullMQ. */
  queueWaitMs: z.number().int().nonnegative().nullable(),
  containerCreateMs: z.number().int().nonnegative(),
  compileMs: z.number().int().nonnegative().nullable(),
  simulateMs: z.number().int().nonnegative().nullable(),
  /** Do `start` do container ate a saida — inclui o overhead de iniciar. */
  executionMs: z.number().int().nonnegative(),
  artifactsReadMs: z.number().int().nonnegative(),
});

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
  /** Posicao (1-based) na fila de espera; `null` fora do status `queued`. */
  queuePosition: z.number().int().nonnegative().nullable(),
  truncated: TruncatedFlagsSchema,
  /** RNF07-I01 — ausente enquanto o job nao terminou. */
  timings: SimulationTimingsSchema.nullable().optional(),
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type TruncatedFlags = z.infer<typeof TruncatedFlagsSchema>;
export type SimulationTimings = z.infer<typeof SimulationTimingsSchema>;
export type SimulationFailure = z.infer<typeof SimulationFailureSchema>;
export type CompileRequest = z.infer<typeof CompileRequestSchema>;
export type SimulationJob = z.infer<typeof SimulationJobSchema>;
export type SimulationResult = z.infer<typeof SimulationResultSchema>;

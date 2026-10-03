import { z } from 'zod';
import { ModuleNameSchema } from './common.js';

/** Linguagens de descricao de hardware. MVP: apenas Verilog (RF02). */
export const HdlLanguageSchema = z.enum(['verilog']);

/**
 * Limite de tamanho do codigo submetido — protege o sandbox (RNF04/RNF05). 64 KB por arquivo:
 * medido em RNF05-I02, dois arquivos de 64 KB compilam em ~0,66 s e ~40 MB (folga de 7,6x e
 * 3,2x sobre os tetos de 5 s e 128 MB); com 128 KB o par ja leva 2 s e 77 MB (2,5x e 1,7x) e
 * com 256 KB estoura ambos. O maior exemplo real tem poucos KB. Mudar este valor exige
 * remedir e revisar `SANDBOX_COMPILE_TIMEOUT_MS`/`SANDBOX_MEMORY_MB` (README.md, secao
 * "Dimensionamento dos limites").
 */
export const MAX_SOURCE_BYTES = 64 * 1024;

export const HdlFileSchema = z.object({
  /** Nome do arquivo dentro do sandbox, ex: `counter.v`. */
  name: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_.-]+\.s?v$/, 'O arquivo deve ter extensão .v ou .sv'),
  content: z
    .string()
    .max(
      MAX_SOURCE_BYTES,
      `O arquivo excede o limite de ${MAX_SOURCE_BYTES / 1024} KB. Reduza o tamanho e execute novamente.`,
    ),
});

/** Conjunto minimo de arquivos de um projeto: fonte + testbench (RF04). */
export const HdlSourcesSchema = z.object({
  language: HdlLanguageSchema.default('verilog'),
  /** Modulo de topo instanciado pelo testbench. */
  topModule: ModuleNameSchema,
  design: HdlFileSchema,
  testbench: HdlFileSchema,
});

export type HdlLanguage = z.infer<typeof HdlLanguageSchema>;
export type HdlFile = z.infer<typeof HdlFileSchema>;
export type HdlSources = z.infer<typeof HdlSourcesSchema>;

import { z } from 'zod';
import { ModuleNameSchema } from './common.js';

/** Linguagens de descricao de hardware. MVP: apenas Verilog (RF02). */
export const HdlLanguageSchema = z.enum(['verilog']);

/** Limites de tamanho do codigo submetido — protege o sandbox (RNF04/RNF05). */
export const MAX_SOURCE_BYTES = 256 * 1024;

export const HdlFileSchema = z.object({
  /** Nome do arquivo dentro do sandbox, ex: `counter.v`. */
  name: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_.-]+\.s?v$/, 'Arquivo deve ter extensao .v ou .sv'),
  content: z.string().max(MAX_SOURCE_BYTES),
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

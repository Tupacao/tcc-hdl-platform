import { z } from 'zod';

/** Identificador de recurso (cuid2/uuid tratados como string opaca). */
export const IdSchema = z.string().min(1).max(64);

/** Nome de modulo Verilog: identificador valido da linguagem. */
export const ModuleNameSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z_][A-Za-z0-9_$]*$/, 'Nome de modulo Verilog invalido');

export const IsoDateSchema = z.iso.datetime();

/** Envelope padrao de erro da API. */
export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type Id = z.infer<typeof IdSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

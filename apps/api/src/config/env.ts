import { z } from 'zod';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3333),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    REDIS_URL: z.string().default('redis://localhost:6379'),
    /** Sem ela, projetos persistem em memoria (RF07) — obrigatoria em producao. */
    DATABASE_URL: z.string().optional(),

    /** Imagem construida a partir de `infra/sandbox/Dockerfile` (iverilog + vvp). */
    SANDBOX_IMAGE: z.string().default('tplab-sandbox:latest'),
    /** Timeout duro do processo de simulacao (RNF05). */
    SANDBOX_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    SANDBOX_MEMORY_MB: z.coerce.number().int().positive().default(128),
    SANDBOX_CPUS: z.coerce.number().positive().default(0.5),
  })
  .refine((value) => value.NODE_ENV !== 'production' || Boolean(value.DATABASE_URL), {
    message: 'DATABASE_URL e obrigatoria quando NODE_ENV=production (RF07)',
    path: ['DATABASE_URL'],
  });

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuracao de ambiente invalida:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

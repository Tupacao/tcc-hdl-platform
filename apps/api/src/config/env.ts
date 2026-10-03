import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  /** Acima disso, novas submissoes sao recusadas com 503 (RF03-I02). */
  SIMULATION_MAX_QUEUE_DEPTH: z.coerce.number().int().positive().default(50),
  /**
   * Retencao dos resultados no Redis (RF03-I03). 1800s cobre com folga o
   * `POLL_TIMEOUT_MS` (60s) do polling em `apps/web/src/lib/api.ts` — nunca
   * baixar disso, ou uma rede lenta perde o resultado no meio do polling.
   */
  JOB_RETENTION_SECONDS: z.coerce.number().int().positive().default(1800),
  JOB_RETENTION_COUNT: z.coerce.number().int().positive().default(100),
  /** Sem ela, projetos persistem em memoria (RF07) — obrigatoria em producao. */
  DATABASE_URL: z.string().optional(),

  /**
   * Endereco do daemon do Docker (RNF04-I02): `tcp://docker-proxy:2375` na VM (o worker nao
   * monta mais o socket — fala com o proxy validador de `infra/docker-proxy`) ou
   * `unix:///caminho`. Vazio = socket padrao do host (desenvolvimento).
   */
  DOCKER_HOST: z
    .string()
    .regex(/^(unix:\/\/\/.+|tcp:\/\/[^:/]+:\d+)$/, 'use unix:///caminho ou tcp://host:porta')
    .optional(),
  /**
   * Onde o worker cria o diretorio de cada job. Vazio = tmpdir do SO (desenvolvimento). Na VM e
   * um diretorio dedicado montado no MESMO caminho no host e no worker (o bind do container de
   * simulacao e resolvido pelo daemon, no host) — e o unico caminho que o proxy aceita em Binds.
   */
  SANDBOX_WORKDIR_ROOT: z.string().startsWith('/').optional(),
  /** Imagem construida a partir de `infra/sandbox/Dockerfile` (iverilog + vvp). */
  SANDBOX_IMAGE: z.string().default('tplab-sandbox:latest'),
  /** Timeout duro do processo de simulacao (RNF05). */
  SANDBOX_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  /** Teto da compilacao (`iverilog`), separado do da simulacao: bem mais curto (RNF05-I01). */
  SANDBOX_COMPILE_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  SANDBOX_MEMORY_MB: z.coerce.number().int().positive().default(128),
  SANDBOX_CPUS: z.coerce.number().positive().default(0.5),
  /**
   * Tetos dos artefatos retidos por job (RF04-I02, dimensionados junto com
   * RF03-I03 para nao ter dois numeros divergentes no mesmo Redis).
   * `stdout`/`stderr` cortam pelo fim (as ultimas linhas costumam ser as
   * informativas quando ha erro); `.vcd` corta pelo inicio (o cabecalho
   * `$var` e obrigatorio para interpretar os valores).
   */
  MAX_STDOUT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(256 * 1024),
  MAX_STDERR_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(64 * 1024),
  MAX_VCD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(2 * 1024 * 1024),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuracao de ambiente invalida:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

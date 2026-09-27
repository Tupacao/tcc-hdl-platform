import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { HealthService } from '../../../domain/health/services/health.service.js';
import type { MetricsService } from '../../../domain/health/services/metrics.service.js';
import { createRedisConnection } from '../../../lib/redis.js';
import { DefaultHealthService } from '../service/health.service.js';
import { RedisMetricsService } from '../service/metrics.service.js';

const HealthSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  version: z.string(),
});

/** RF03-I04 — numeros que sustentam RNF07 e dimensionam RF03-I02/I03. */
const MetricsSchema = z.object({
  totalJobs: z.number().int().nonnegative(),
  succeededJobs: z.number().int().nonnegative(),
  failedJobs: z.number().int().nonnegative(),
  failuresByType: z.record(z.string(), z.number().int().nonnegative()),
  averageDurationMs: z.number().nonnegative().nullable(),
});

export async function healthRoutes(
  app: FastifyInstance,
  options: { service?: HealthService; metricsService?: MetricsService } = {},
): Promise<void> {
  const service = options.service ?? new DefaultHealthService();
  const metricsService = options.metricsService ?? new RedisMetricsService(createRedisConnection());

  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/health',
    { schema: { tags: ['system'], response: { 200: HealthSchema } } },
    async () => service.check(),
  );

  typed.get(
    '/health/metrics',
    { schema: { tags: ['system'], response: { 200: MetricsSchema } } },
    async () => metricsService.getMetrics(),
  );
}

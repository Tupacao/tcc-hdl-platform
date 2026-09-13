import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { HealthService } from '../../../domain/health/services/health.service.js';
import { DefaultHealthService } from '../service/health.service.js';

const HealthSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  version: z.string(),
});

export async function healthRoutes(
  app: FastifyInstance,
  options: { service?: HealthService } = {},
): Promise<void> {
  const service = options.service ?? new DefaultHealthService();

  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/health', { schema: { tags: ['system'], response: { 200: HealthSchema } } }, async () =>
      service.check(),
    );
}

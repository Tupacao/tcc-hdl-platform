import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const HealthSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  version: z.string(),
});

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/health',
      { schema: { tags: ['system'], response: { 200: HealthSchema } } },
      async () => ({
        status: 'ok' as const,
        uptime: process.uptime(),
        version: process.env.npm_package_version ?? '0.1.0',
      }),
    );
}

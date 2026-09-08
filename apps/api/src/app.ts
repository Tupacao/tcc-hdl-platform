import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { healthRoutes } from './modules/health/routes.js';
import { projectRoutes } from './modules/projects/routes.js';
import { simulationRoutes } from './modules/simulation/routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'development' ? { level: 'info' } : true,
    bodyLimit: 1024 * 1024,
  });

  // Toda validacao de entrada/saida usa os schemas Zod de `packages/shared`.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((value) => value.trim()),
  });
  // Barreira simples contra abuso do endpoint de simulacao (RNF05).
  await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Dados de entrada invalidos',
        details: error.validation,
      });
    }

    request.log.error(error);
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      statusCode,
      error: error.name,
      message: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
    });
  });

  await app.register(healthRoutes);
  await app.register(projectRoutes, { prefix: '/api' });
  await app.register(simulationRoutes, { prefix: '/api' });

  return app;
}

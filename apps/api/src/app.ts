import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import { MAX_SOURCE_BYTES } from '@tplab/shared';
import { healthRoutes } from './application/health/controller/health.controller.js';
import { projectRoutes } from './application/projects/controller/project.controller.js';
import { InMemoryProjectRepository } from './application/projects/repository/in-memory-project.repository.js';
import { PrismaProjectRepository } from './application/projects/repository/prisma-project.repository.js';
import { DefaultProjectService } from './application/projects/service/project.service.js';
import { env } from './config/env.js';
import type { ProjectService } from './domain/projects/services/project.service.js';
import { getPrismaClient } from './infra/prisma/client.js';
import { simulationRoutes } from './modules/simulation/routes.js';

/**
 * Maior corpo esperado e a submissao de simulacao (RF03): design + testbench,
 * cada um ate `MAX_SOURCE_BYTES`. O multiplicador de 4x cobre o pior caso de
 * escape de aspas/barras invertidas na serializacao JSON, mais folga para os
 * demais campos do corpo (`topModule`, `language`, `projectId`).
 */
const SIMULATION_BODY_LIMIT_BYTES = MAX_SOURCE_BYTES * 2 * 4;

/**
 * Com `DATABASE_URL`, persiste em Postgres via Prisma; sem ela, sobe em memoria
 * (dev local sem banco) com aviso — `env.ts` ja exige a variavel em producao.
 */
function createProjectService(): ProjectService {
  if (env.DATABASE_URL) {
    return new DefaultProjectService(new PrismaProjectRepository(getPrismaClient()));
  }
  console.warn('DATABASE_URL nao definida: projetos serao persistidos em memoria (RF07).');
  return new DefaultProjectService(new InMemoryProjectRepository());
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'development' ? { level: 'info' } : true,
    bodyLimit: SIMULATION_BODY_LIMIT_BYTES,
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

  // Documentacao OpenAPI gerada a partir dos mesmos schemas Zod das rotas.
  await app.register(swagger, {
    openapi: {
      info: { title: 'TPLab API', version: process.env.npm_package_version ?? '0.1.0' },
      tags: [
        { name: 'system', description: 'Status da API' },
        { name: 'projects', description: 'CRUD de projetos (RF07)' },
        { name: 'simulation', description: 'Compilacao e simulacao de HDL (RF03/RF04)' },
      ],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      // error.validation[0].message carrega a mensagem em portugues do schema
      // Zod que falhou (ex.: extensao de arquivo, tamanho, topModule vazio).
      const firstValidationMessage = (error.validation[0] as { message?: string } | undefined)
        ?.message;
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: firstValidationMessage ?? 'Dados de entrada invalidos',
        details: error.validation,
      });
    }

    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.status(413).send({
        statusCode: 413,
        error: 'Payload Too Large',
        message: 'Corpo da requisicao excede o limite permitido',
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
  await app.register(projectRoutes, { prefix: '/api', service: createProjectService() });
  await app.register(simulationRoutes, { prefix: '/api' });

  return app;
}

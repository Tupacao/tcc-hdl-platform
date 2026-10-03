import Fastify, { type FastifyError } from 'fastify';
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
import { logger } from './lib/logger.js';
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

// Sem tipo de retorno explicito: `loggerInstance: logger` (pino) faz a
// instancia inferida ficar mais especifica que `FastifyInstance` generico
// (com `FastifyBaseLogger`) — anotar aqui quebraria por invariancia do
// generico `childLoggerFactory`. Quem chama `buildApp()` so usa o valor
// (`app.inject`, `app.close`, `app.listen`), nunca anota o tipo do retorno.
export async function buildApp() {
  const app = Fastify({
    // Mesma instancia pino do worker (RF03-I04) — os dois processos passam a
    // logar no mesmo formato estruturado, correlavel entre si.
    loggerInstance: logger,
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
        message:
          firstValidationMessage ?? 'Dados inválidos. Confira os arquivos e tente novamente.',
        details: error.validation,
      });
    }

    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.status(413).send({
        statusCode: 413,
        error: 'Payload Too Large',
        message:
          'O código enviado excede o limite permitido. Reduza o tamanho dos arquivos e execute novamente.',
      });
    }

    if (error.statusCode === 429) {
      // @fastify/rate-limit ja define o cabecalho Retry-After antes de lancar;
      // so trocamos o corpo pela mensagem em portugues no formato ApiErrorSchema.
      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Muitas simulações em sequência. Aguarde antes de tentar novamente.',
      });
    }

    request.log.error(error);
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      statusCode,
      error: error.name,
      message:
        statusCode >= 500
          ? 'Erro interno da plataforma. Tente novamente em instantes.'
          : error.message,
    });
  });

  await app.register(healthRoutes);
  await app.register(projectRoutes, { prefix: '/api', service: createProjectService() });
  await app.register(simulationRoutes, { prefix: '/api' });

  return app;
}

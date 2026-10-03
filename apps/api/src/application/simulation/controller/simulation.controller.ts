import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ApiErrorSchema,
  CompileRequestSchema,
  SimulationJobSchema,
  SimulationResultSchema,
} from '@tplab/shared';
import { QueueFullError } from '../../../domain/simulation/entities/simulation-error.js';
import type { SimulationService } from '../../../domain/simulation/services/simulation.service.js';

const JobIdParamsSchema = z.object({ jobId: z.string().min(1) });

export interface SimulationRoutesOptions {
  /** Injetado por `app.ts` — a rota nao monta a propria dependencia. */
  service: SimulationService;
}

/**
 * Entrada HTTP da simulacao (RF03/RF04). So valida, chama o service e traduz
 * falha de dominio em status — nenhuma regra de negocio nem acesso a fila aqui.
 */
export async function simulationRoutes(
  app: FastifyInstance,
  { service }: SimulationRoutesOptions,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // RF03/RF04: enfileira compilacao + simulacao; a execucao ocorre no sandbox.
  typed.post(
    '/simulations',
    {
      schema: {
        tags: ['simulation'],
        body: CompileRequestSchema,
        response: { 202: SimulationJobSchema, 429: ApiErrorSchema, 503: ApiErrorSchema },
      },
      // Enfileirar um job custa um container inteiro — bem mais caro que as
      // demais rotas, que ficam sob o limite global de app.ts (RF03-I02).
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      try {
        const job = await service.enqueue(request.body);
        return reply.status(202).send(job);
      } catch (cause) {
        if (cause instanceof QueueFullError) {
          return reply.status(503).send({
            statusCode: 503,
            error: 'Service Unavailable',
            message: 'Fila de simulações cheia. Tente novamente em alguns minutos.',
          });
        }
        // Sem Redis a fila nao aceita jobs: mensagem explicita em vez de 500 generico.
        request.log.error(cause);
        return reply.status(503).send({
          statusCode: 503,
          error: 'Service Unavailable',
          message:
            'O serviço de simulação está indisponível. Tente novamente em instantes; se persistir, avise quem mantém a plataforma.',
        });
      }
    },
  );

  // Polling do resultado — inclui diagnosticos (RF05) e o .vcd (RF06).
  typed.get(
    '/simulations/:jobId',
    {
      schema: {
        tags: ['simulation'],
        params: JobIdParamsSchema,
        response: { 200: SimulationResultSchema, 404: ApiErrorSchema },
      },
      // POST /simulations tem limite proprio, mais apertado (10/min, RF03-I02)
      // porque enfileira um job — enfileirar abuso o pipeline, so ler o
      // resultado nao. runSimulation (apps/web/src/lib/api.ts) faz polling
      // desta rota a cada 400ms - 150 req/min so dessa unica simulacao -
      // entao herdar o limite de POST derrubava com 429 qualquer execucao que
      // passasse de ~24s, mesmo sem nenhum abuso real. Leitura barata e
      // idempotente: limite proprio, generoso o bastante para cobrir o
      // timeout do cliente (60s) com folga para mais de uma simulacao em
      // paralelo, sem abrir mao de um teto.
      config: { rateLimit: { max: 300, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const result = await service.findResult(request.params.jobId);

      if (!result) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Simulação não encontrada ou expirada. Execute o circuito novamente.',
        });
      }

      return reply.send(result);
    },
  );
}

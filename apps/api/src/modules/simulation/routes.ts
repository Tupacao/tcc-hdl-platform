import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ApiErrorSchema,
  CompileRequestSchema,
  SimulationJobSchema,
  SimulationResultSchema,
  type JobStatus,
  type SimulationResult,
} from '@hdl/shared';
import { simulationQueue } from './queue.js';

const JobIdParamsSchema = z.object({ jobId: z.string().min(1) });

/** Estados internos do BullMQ mapeados para o contrato publico da API. */
function toJobStatus(state: string): JobStatus {
  switch (state) {
    case 'completed':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'active':
      return 'running';
    default:
      return 'queued';
  }
}

export async function simulationRoutes(app: FastifyInstance): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // RF03/RF04: enfileira compilacao + simulacao; a execucao ocorre no sandbox.
  typed.post(
    '/simulations',
    {
      schema: {
        tags: ['simulation'],
        body: CompileRequestSchema,
        response: { 202: SimulationJobSchema, 503: ApiErrorSchema },
      },
    },
    async (request, reply) => {
      try {
        const job = await simulationQueue.add('simulate', request.body);

        return reply.status(202).send({
          jobId: String(job.id),
          status: 'queued' as const,
          createdAt: new Date(job.timestamp).toISOString(),
        });
      } catch (cause) {
        // Sem Redis a fila nao aceita jobs: mensagem explicita em vez de 500 generico.
        request.log.error(cause);
        return reply.status(503).send({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'Fila de simulacao indisponivel. Verifique se o Redis esta em execucao.',
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
    },
    async (request, reply) => {
      const job = await simulationQueue.getJob(request.params.jobId);

      if (!job) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Simulacao nao encontrada ou expirada',
        });
      }

      const status = toJobStatus(await job.getState());
      const pending: SimulationResult = {
        jobId: String(job.id),
        status,
        failure: null,
        diagnostics: [],
        stdout: '',
        stderr: '',
        vcd: null,
        durationMs: 0,
        finishedAt: null,
      };

      if (status !== 'succeeded' || !job.returnvalue) {
        if (status === 'failed') {
          return reply.send({
            ...pending,
            failure: 'internal_error' as const,
            stderr: job.failedReason ?? 'Falha inesperada na execucao',
            finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
          });
        }
        return reply.send(pending);
      }

      return reply.send({
        ...job.returnvalue,
        jobId: String(job.id),
        status,
      });
    },
  );
}

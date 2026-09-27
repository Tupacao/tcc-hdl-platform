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
} from '@tplab/shared';
import { env } from '../../config/env.js';
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

/**
 * Posicao (1-based) do job na lista de espera FIFO do BullMQ. `null` quando o
 * job nao esta mais nela (ja foi pego pelo worker entre o `getState()` e esta
 * chamada) — corrida rara e inofensiva, so faz a posicao sumir por um poll.
 */
async function getQueuePosition(jobId: string | undefined): Promise<number | null> {
  const waiting = await simulationQueue.getJobs(['waiting'], 0, -1);
  const index = waiting.findIndex((waitingJob) => waitingJob.id === jobId);
  return index === -1 ? null : index + 1;
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
        response: { 202: SimulationJobSchema, 429: ApiErrorSchema, 503: ApiErrorSchema },
      },
      // Enfileirar um job custa um container inteiro — bem mais caro que as
      // demais rotas, que ficam sob o limite global de app.ts (RF03-I02).
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      try {
        const waitingCount = await simulationQueue.getWaitingCount();
        if (waitingCount >= env.SIMULATION_MAX_QUEUE_DEPTH) {
          return reply.status(503).send({
            statusCode: 503,
            error: 'Service Unavailable',
            message: 'Fila de simulacoes cheia. Tente novamente em alguns minutos.',
          });
        }

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
        queuePosition: status === 'queued' ? await getQueuePosition(job.id) : null,
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

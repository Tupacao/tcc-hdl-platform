import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ApiErrorSchema, CreateFeedbackSchema, FeedbackReceiptSchema } from '@tplab/shared';
import { FeedbackDailyLimitError } from '../../../domain/feedback/entities/feedback-error.js';
import type { FeedbackService } from '../../../domain/feedback/services/feedback.service.js';

export interface FeedbackRoutesOptions {
  service: FeedbackService;
}

/**
 * Codigo que marca um 429 com mensagem propria da rota. O tratador global de
 * `app.ts` usa a mensagem do erro quando ela vem marcada assim; sem a marca, o
 * texto padrao (limite de simulacoes) apareceria no formulario de feedback.
 */
export const RATE_LIMIT_ERROR_CODE = 'TPLAB_RATE_LIMIT';

/** Guarda de rajada: protege a rota antes de qualquer trabalho de banco. */
const BURST_LIMIT = { max: 20, timeWindow: '1 hour' } as const;

function rateLimitError(message: string): Error {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = 429;
  error.code = RATE_LIMIT_ERROR_CODE;
  return error;
}

/**
 * Entrada HTTP do feedback (RF17-I01). Rota publica de escrita, entao dois
 * limites: a guarda de rajada deste plugin (por requisicao, inclusive as
 * invalidas) e o limite diario do service (por relato gravado), que e o numero
 * que o usuario le. Nada do texto recebido volta na resposta.
 */
export async function feedbackRoutes(
  app: FastifyInstance,
  { service }: FeedbackRoutesOptions,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    '/feedback',
    {
      schema: {
        tags: ['feedback'],
        body: CreateFeedbackSchema,
        response: { 201: FeedbackReceiptSchema, 400: ApiErrorSchema, 429: ApiErrorSchema },
      },
      config: {
        rateLimit: {
          ...BURST_LIMIT,
          errorResponseBuilder: () =>
            rateLimitError('Muitas mensagens em sequência. Aguarde alguns minutos.'),
        },
      },
    },
    async (request, reply) => {
      try {
        const receipt = await service.submit(request.body, {
          // `request.ip` respeita `trustProxy` quando a API estiver atras do proxy
          // reverso da VM; nunca e gravado em claro (so o hash com sal).
          ip: request.ip ?? null,
        });
        return reply.status(201).send(receipt);
      } catch (cause) {
        if (cause instanceof FeedbackDailyLimitError) {
          // Limite frouxo de proposito (RF17): o custo de bloquear um relato
          // legitimo e maior que o de receber uma mensagem repetida.
          return reply.status(429).send({
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Você já enviou ${cause.limit} mensagens hoje. O limite volta a zerar amanhã.`,
          });
        }
        throw cause;
      }
    },
  );
}

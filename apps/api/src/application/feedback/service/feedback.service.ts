import { createHash, randomBytes } from 'node:crypto';
import type { CreateFeedback, FeedbackReceipt } from '@tplab/shared';
import { env } from '../../../config/env.js';
import { FeedbackDailyLimitError } from '../../../domain/feedback/entities/feedback-error.js';
import type { FeedbackRepository } from '../../../domain/feedback/repositories/feedback.repository.js';
import type {
  FeedbackOrigin,
  FeedbackService,
} from '../../../domain/feedback/services/feedback.service.js';
import { logger } from '../../../lib/logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sem `FEEDBACK_IP_SALT` definido, sorteia um sal por processo. Hash de IP sem sal
 * e reversivel por forca bruta (o espaco de IPv4 inteiro cabe em minutos), o que
 * transformaria a coluna em registro de identificacao pessoal — exatamente o que
 * guardar o hash evita.
 */
function resolveSalt(): string {
  if (env.FEEDBACK_IP_SALT) return env.FEEDBACK_IP_SALT;
  logger.warn(
    'FEEDBACK_IP_SALT nao definida: usando sal aleatorio deste processo — os hashes de IP do feedback mudam a cada reinicio, e com eles o limite diario (RF17-I01)',
  );
  return randomBytes(32).toString('hex');
}

/**
 * RF17: recebe o relato ja validado pelo schema de `@tplab/shared`, anonimiza a
 * origem, aplica o limite diario e grava. O texto e tratado como dado em todo o
 * caminho — nao entra em log estruturado nem volta na resposta.
 */
export class DefaultFeedbackService implements FeedbackService {
  readonly #salt: string;

  constructor(
    private readonly repository: FeedbackRepository,
    private readonly maxPerDay: number = env.FEEDBACK_MAX_PER_DAY,
    salt: string = resolveSalt(),
  ) {
    this.#salt = salt;
  }

  async submit(input: CreateFeedback, origin: FeedbackOrigin): Promise<FeedbackReceipt> {
    const ipHash = this.hashIp(origin.ip);

    // Sem IP nao ha a quem atribuir o limite; o rate limit da rota ainda vale.
    if (ipHash) {
      const sent = await this.repository.countSince(ipHash, new Date(Date.now() - DAY_MS));
      if (sent >= this.maxPerDay) throw new FeedbackDailyLimitError(this.maxPerDay);
    }

    const feedback = await this.repository.create({
      kind: input.kind,
      message: input.message,
      contact: input.contact ?? null,
      context: input.context ?? null,
      userId: origin.userId ?? null,
      ipHash,
    });

    // Sem o texto e sem o contato: o log diz que um relato chegou, nao o que diz.
    logger.info(
      { feedbackId: feedback.id, kind: feedback.kind, hasContext: feedback.context !== null },
      'feedback recebido',
    );

    return { id: feedback.id, receivedAt: feedback.createdAt.toISOString() };
  }

  private hashIp(ip: string | null): string | null {
    if (!ip) return null;
    return createHash('sha256').update(`${this.#salt}:${ip}`).digest('hex');
  }
}

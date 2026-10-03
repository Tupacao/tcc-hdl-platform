import { randomUUID } from 'node:crypto';
import type { Feedback, NewFeedback } from '../../../domain/feedback/entities/feedback.js';
import type { FeedbackRepository } from '../../../domain/feedback/repositories/feedback.repository.js';

/**
 * Implementacao em memoria — desenvolvimento local sem Postgres e testes. O
 * relato se perde no reinicio, o que e aceitavel em dev: o alternativo seria o
 * formulario responder erro em toda maquina sem banco.
 */
export class InMemoryFeedbackRepository implements FeedbackRepository {
  readonly #entries: Feedback[] = [];

  async create(input: NewFeedback): Promise<Feedback> {
    const feedback: Feedback = { ...input, id: randomUUID(), createdAt: new Date() };
    this.#entries.push(feedback);
    return feedback;
  }

  async countSince(ipHash: string, since: Date): Promise<number> {
    return this.#entries.filter((entry) => entry.ipHash === ipHash && entry.createdAt >= since)
      .length;
  }

  /** So para inspecao em desenvolvimento e teste; nao ha rota publica de leitura. */
  async list(): Promise<readonly Feedback[]> {
    return [...this.#entries];
  }
}

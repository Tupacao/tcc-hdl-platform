import type { Feedback, NewFeedback } from '../entities/feedback.js';

/**
 * Persistencia do feedback (RF17-I01). Nao ha leitura publica: o autor do TCC
 * consulta o Postgres direto (procedimento no `README.md`), e uma rota de
 * leitura exigiria autorizacao, que nao existe antes de RF14.
 */
export interface FeedbackRepository {
  create(input: NewFeedback): Promise<Feedback>;
  /**
   * Quantos relatos a mesma chave de limite (sessao anonima, ou o IP quando nao ha
   * sessao) gravou desde `since`. Conta envios aceitos, nao requisicoes.
   */
  countSince(limitKey: string, since: Date): Promise<number>;
}

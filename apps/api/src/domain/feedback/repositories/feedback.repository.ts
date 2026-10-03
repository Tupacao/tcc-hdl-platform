import type { Feedback, NewFeedback } from '../entities/feedback.js';

/**
 * Persistencia do feedback (RF17-I01). Nao ha leitura publica: o autor do TCC
 * consulta o Postgres direto (procedimento no `README.md`), e uma rota de
 * leitura exigiria autorizacao, que nao existe antes de RF14.
 */
export interface FeedbackRepository {
  create(input: NewFeedback): Promise<Feedback>;
  /**
   * Quantos relatos a mesma origem (hash do IP) gravou desde `since` — base do
   * limite diario. Conta envios aceitos, nao requisicoes.
   */
  countSince(ipHash: string, since: Date): Promise<number>;
}

import type { FeedbackContext, FeedbackKind } from '@tplab/shared';

/**
 * Relato gravado (RF17). Nao e o corpo da requisicao: `ipHash` e `userId` sao
 * decididos pelo servidor, nunca aceitos do cliente.
 */
export interface Feedback {
  id: string;
  kind: FeedbackKind;
  message: string;
  contact: string | null;
  context: FeedbackContext | null;
  /** RF14: dono do relato quando houver sessao autenticada. */
  userId: string | null;
  /** SHA-256 do IP com sal — agrupa abuso sem guardar dado pessoal. */
  ipHash: string | null;
  createdAt: Date;
}

/** O que o repositorio precisa para gravar um relato. */
export type NewFeedback = Omit<Feedback, 'id' | 'createdAt'>;

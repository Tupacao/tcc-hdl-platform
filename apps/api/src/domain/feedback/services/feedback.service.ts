import type { CreateFeedback, FeedbackReceipt } from '@tplab/shared';

/** Dados da requisicao que o servidor observa — nunca vem do corpo. */
export interface FeedbackOrigin {
  /** IP de quem enviou; usado so para derivar o hash, nunca gravado em claro. */
  ip: string | null;
  /** RF14: usuario autenticado, quando houver sessao. */
  userId?: string | null;
}

/** Regra de negocio do feedback (RF17): anonimizar a origem e gravar o relato. */
export interface FeedbackService {
  submit(input: CreateFeedback, origin: FeedbackOrigin): Promise<FeedbackReceipt>;
}

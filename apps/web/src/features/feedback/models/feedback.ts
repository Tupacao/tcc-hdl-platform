import type { FeedbackContext, FeedbackKind } from '@tplab/shared';

/** Os três tipos oferecidos na interface (Figma 10.1); `outro` existe só no contrato. */
export type OfferedFeedbackKind = Extract<FeedbackKind, 'problema' | 'sugestao' | 'elogio'>;

/** Estado do envio (Figma 10.5). O texto nunca é apagado antes da confirmação do servidor. */
export type FeedbackSubmitState =
  | { kind: 'editing' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'failed'; message: string }
  | { kind: 'limited' };

/** O que a última execução deixou para o contexto técnico, já pronto para exibir. */
export interface RunContextSnapshot {
  projectName: string | null;
  projectId: string | null;
  /** Resumo legível da última execução ("falhou · 1 erro · 0,12 s"). */
  lastRun: string | null;
  /** Primeira linha útil do compilador, já cortada. */
  compilerOutput: string | null;
}

/** Uma linha da lista "o que vai junto", mostrada ao usuário antes de enviar. */
export interface ContextLine {
  label: string;
  value: string;
}

export type { FeedbackContext };

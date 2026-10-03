import { CreateFeedbackSchema, FEEDBACK_MESSAGE_MIN, type CreateFeedback } from '@tplab/shared';

export interface FeedbackFieldErrors {
  message?: string;
  contact?: string;
}

/**
 * Valida com o **mesmo** schema do backend (`@tplab/shared`) — sem regra
 * duplicada. Devolve a primeira mensagem de cada campo, já em português, porque
 * é o schema que carrega os textos.
 */
export function validateFeedback(input: CreateFeedback): FeedbackFieldErrors {
  const parsed = CreateFeedbackSchema.safeParse(input);
  if (parsed.success) return {};

  const errors: FeedbackFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === 'message' && !errors.message) errors.message = issue.message;
    if (field === 'contact' && !errors.contact) errors.contact = issue.message;
  }
  return errors;
}

/**
 * O botão "Enviar" só acende a partir do mínimo (Figma 10.5). A validação em si
 * só aparece **depois** da primeira tentativa de enviar: marcar de vermelho um
 * campo ainda sendo preenchido é acusar antes de haver erro.
 */
export function canSubmit(message: string): boolean {
  return message.trim().length >= FEEDBACK_MESSAGE_MIN;
}

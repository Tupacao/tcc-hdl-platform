/** Textos fixos do feedback (RF17, Figma 10.1 e 10.5) — não deixar string solta em componente. */

export const FEEDBACK_TRIGGER_LABEL = 'Enviar feedback';

export const FEEDBACK_DIALOG = {
  TITLE: 'Como está sendo usar o TP Lab?',
  DESCRIPTION:
    'Isto é um trabalho de conclusão de curso. O que você escrever aqui orienta o que vem depois.',
  MESSAGE_LABEL: 'O que você quer contar?',
  MESSAGE_PLACEHOLDER: 'A onda do sinal cout não aparece quando eu uso barramento de 8 bits…',
  CONTACT_LABEL: 'Seu e-mail (opcional)',
  CONTACT_PLACEHOLDER: 'para o caso de eu precisar perguntar algo',
  CONTACT_HINT: 'Sem e-mail o relato continua valendo — ninguém precisa se identificar.',
  CONTEXT_TITLE: 'Anexar o contexto técnico',
  CONTEXT_SUBTITLE: 'navegador, tamanho da tela e a última saída do compilador',
  CONTEXT_EXPAND: 'Ver exatamente o que vai junto',
  CONTEXT_COLLAPSE: 'Ocultar o que vai junto',
  CONTEXT_EMPTY: 'Nada para anexar ainda — execute o circuito e o contexto aparece aqui.',
  NEVER_SENT: 'o código do seu circuito não vai junto',
  PRIVACY_NOTE: 'O código do seu circuito nunca é enviado junto.',
  CANCEL: 'Cancelar',
  SUBMIT: 'Enviar',
  SUBMITTING: 'Enviando…',
  RETRY: 'Tentar de novo',
} as const;

/** Rótulos dos três tipos. `outro` existe no contrato, mas não é oferecido na interface. */
export const FEEDBACK_KIND_LABELS = {
  problema: 'Algo quebrou',
  sugestao: 'Tenho uma sugestão',
  elogio: 'Está funcionando bem',
} as const;

export const FEEDBACK_KIND_GROUP_LABEL = 'Tipo do relato';

export const FEEDBACK_ERROR = {
  TITLE: 'Não foi possível enviar',
  DESCRIPTION: 'O texto continua no campo, nada se perde. Confira a conexão e tente de novo.',
} as const;

export const FEEDBACK_LIMIT = {
  TITLE: 'Você já enviou 5 mensagens hoje',
  DESCRIPTION:
    'O limite existe para o canal não virar depósito de mensagens automáticas. Ele zera amanhã — e o que você já mandou está guardado.',
  CLOSE: 'Entendi',
} as const;

/** Rótulos da lista de contexto técnico, na ordem em que aparecem. */
export const FEEDBACK_CONTEXT_LABELS = {
  browser: 'navegador',
  screen: 'tela',
  project: 'projeto',
  lastRun: 'última execução',
  compilerOutput: 'saída do compilador',
  session: 'identificador da sessão',
} as const;

export function formatCharacterCount(length: number, max: number): string {
  return `${length} / ${max}`;
}

export function formatSessionValue(sessionId: string): string {
  return `${sessionId} (anônimo, fica só neste navegador)`;
}

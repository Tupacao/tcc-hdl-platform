/** Textos fixos do tour (RF16, Figma 7.4 e 7.7) — não deixar string solta em componente. */

export const TOUR_BUTTONS = {
  NEXT: 'Próximo',
  PREVIOUS: 'Anterior',
  DONE: 'Concluir',
  /** "Pular" é texto simples, nunca botão: abandonar o tour não tem o mesmo peso de continuar. */
  SKIP: 'Pular',
} as const;

export const TOUR_MENU = {
  /** Rótulo do menu "?" do cabeçalho. */
  TRIGGER_LABEL: 'Ajuda',
  RESTART: 'Refazer o tour de introdução',
} as const;

export const TOUR_DIALOG_LABEL = 'Tutorial de primeiro acesso';

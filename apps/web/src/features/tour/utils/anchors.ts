/**
 * Âncoras do tour (RF16-I01). Atributo dedicado, nunca classe de estilo: classe
 * do Tailwind muda a cada ajuste visual, e só o primeiro acesso executa o tour —
 * ninguém perceberia que ele passou a apontar para o vazio.
 */
export const TOUR_ANCHORS = {
  EDITOR: 'editor',
  FILE_TABS: 'file-tabs',
  RUN_BUTTON: 'run-button',
  CONSOLE: 'console',
  WAVEFORM: 'waveform',
  HELP_MENU: 'help-menu',
} as const;

export type TourAnchor = (typeof TOUR_ANCHORS)[keyof typeof TOUR_ANCHORS];

export function anchorSelector(anchor: TourAnchor): string {
  return `[data-tour="${anchor}"]`;
}

export function anchorAttributes(anchor: TourAnchor): { 'data-tour': TourAnchor } {
  return { 'data-tour': anchor };
}

/** Elemento da âncora, ou `null` quando ela não está na tela. */
export function findAnchor(anchor: TourAnchor, root: ParentNode): Element | null {
  return root.querySelector(anchorSelector(anchor));
}

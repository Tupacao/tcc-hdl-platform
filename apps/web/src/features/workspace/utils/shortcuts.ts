/**
 * Registro central dos atalhos do workspace (RF09-I02). A mesma lista alimenta
 * os ouvintes de teclado e o diálogo de ajuda, para a documentação não envelhecer.
 */

export type ShortcutId =
  'run' | 'save' | 'comment' | 'next-diagnostic' | 'previous-diagnostic' | 'leave-editor' | 'help';

/** `mod` = Ctrl (Windows/Linux) ou Cmd (macOS). */
export interface ShortcutCombo {
  key: string;
  mod?: boolean;
  shift?: boolean;
}

export type ShortcutScope = 'global' | 'editor';

export interface ShortcutDefinition {
  id: ShortcutId;
  combo: ShortcutCombo;
  description: string;
  scope: ShortcutScope;
}

export const SHORTCUTS: ShortcutDefinition[] = [
  { id: 'run', combo: { key: 'Enter', mod: true }, description: 'Executar', scope: 'global' },
  { id: 'save', combo: { key: 's', mod: true }, description: 'Salvar', scope: 'global' },
  {
    id: 'comment',
    combo: { key: '/', mod: true },
    description: 'Comentar a linha',
    scope: 'editor',
  },
  {
    id: 'next-diagnostic',
    combo: { key: 'F8' },
    description: 'Ir ao próximo erro',
    scope: 'global',
  },
  {
    id: 'previous-diagnostic',
    combo: { key: 'F8', shift: true },
    description: 'Ir ao erro anterior',
    scope: 'global',
  },
  { id: 'help', combo: { key: '?' }, description: 'Abrir os atalhos', scope: 'global' },
  {
    id: 'leave-editor',
    combo: { key: 'Escape' },
    description: 'Sair do editor (volta à navegação por Tab)',
    scope: 'editor',
  },
];

export const SHORTCUTS_DIALOG = {
  TITLE: 'Atalhos de teclado',
  DESCRIPTION: 'Todo atalho tem também um botão equivalente na interface.',
  BUTTON_LABEL: 'Atalhos de teclado',
};

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
}

export function getShortcut(id: ShortcutId): ShortcutDefinition {
  const shortcut = SHORTCUTS.find((candidate) => candidate.id === id);
  if (!shortcut) throw new Error(`Atalho desconhecido: ${id}`);
  return shortcut;
}

/** Teclas para exibição, ex.: `['Ctrl', 'Enter']` ou `['⌘', '⏎']` no macOS. */
export function formatCombo(combo: ShortcutCombo, isMac: boolean): string[] {
  const keys: string[] = [];
  if (combo.mod) keys.push(isMac ? '⌘' : 'Ctrl');
  if (combo.shift) keys.push(isMac ? '⇧' : 'Shift');
  keys.push(displayKey(combo.key, isMac));
  return keys;
}

function displayKey(key: string, isMac: boolean): string {
  if (key === 'Enter') return isMac ? '⏎' : 'Enter';
  if (key === 'Escape') return 'Esc';
  return key.length === 1 ? key.toUpperCase() : key;
}

interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Compara um evento de teclado com o combo, tratando Ctrl/Cmd conforme a plataforma. */
export function matchesShortcut(event: KeyLike, combo: ShortcutCombo, isMac: boolean): boolean {
  if (event.altKey) return false;
  const modPressed = isMac ? event.metaKey : event.ctrlKey;
  const otherModPressed = isMac ? event.ctrlKey : event.metaKey;
  if (Boolean(combo.mod) !== modPressed || otherModPressed) return false;
  // `?` já exige Shift no teclado; só compara Shift quando o combo o declara.
  if (combo.key !== '?' && Boolean(combo.shift) !== event.shiftKey) return false;
  return event.key.toLowerCase() === combo.key.toLowerCase();
}

/** Campos de texto (inclusive o do Monaco) não disparam atalhos de tecla simples como `?`. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

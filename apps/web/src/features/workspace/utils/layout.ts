/**
 * Layout dos painéis do workspace (RF09-I01): tamanhos padrão, limites e
 * persistência em `localStorage`. Os números vivem só aqui.
 */

/** Percentuais de cada grupo, na ordem em que os painéis aparecem. */
export const DEFAULT_HORIZONTAL_LAYOUT = [58, 42] as const; // [editor + console, ondas]
export const DEFAULT_VERTICAL_LAYOUT = [70, 30] as const; // [editor, console]

/** Tamanhos mínimos (%): mantêm cada painel utilizável. */
export const PANEL_MIN_SIZE = {
  EDITOR_COLUMN: 30,
  WAVEFORM: 25,
  EDITOR: 30,
  CONSOLE: 20,
} as const;

// A versão na chave permite invalidar layouts salvos quando a estrutura mudar.
export const HORIZONTAL_LAYOUT_KEY = 'tplab-workspace-h-v1';
export const VERTICAL_LAYOUT_KEY = 'tplab-workspace-v-v1';

export type PanelLayout = readonly [number, number];

/** Lê um layout salvo; devolve `null` se ausente, inválido ou se o storage falhar. */
export function loadLayout(key: string): PanelLayout | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      parsed.every((size) => typeof size === 'number' && Number.isFinite(size) && size > 0) &&
      Math.abs((parsed[0] as number) + (parsed[1] as number) - 100) < 1
    ) {
      return [parsed[0] as number, parsed[1] as number];
    }
  } catch {
    // Storage indisponível (modo privativo) ou JSON corrompido: usa o padrão.
  }
  return null;
}

/** Salva o layout; se for igual ao padrão, apaga o valor salvo. */
export function saveLayout(key: string, sizes: number[], defaults: PanelLayout): void {
  try {
    const isDefault = sizes.every((size, index) => Math.abs(size - (defaults[index] ?? -1)) < 0.5);
    if (isDefault) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(sizes));
  } catch {
    // Sem persistência: o layout vale apenas para a sessão atual.
  }
}

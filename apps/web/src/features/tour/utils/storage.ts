/**
 * Preferência de "já vi o tour" (RF16-I02). Mesmo padrão do `ThemeProvider`:
 * `localStorage` com `try/catch`. Sem armazenamento, o tour roda toda vez em vez
 * de quebrar — a degradação aceitável.
 */
const TOUR_SEEN_KEY = 'tplab-tour-seen';

/**
 * O valor é versionado: quando o roteiro mudar de forma relevante, subir para
 * `v2` reexibe o tour para quem já viu o `v1`, sem precisar de outra chave.
 */
export const TOUR_VERSION = 'v1';

export function hasSeenTour(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(TOUR_SEEN_KEY) === TOUR_VERSION;
  } catch {
    // Armazenamento bloqueado: trata como "nunca viu" e roda de novo.
    return false;
  }
}

/** Marcado tanto ao concluir quanto ao pular — pular é decisão, não acidente. */
export function markTourSeen(storage: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(TOUR_SEEN_KEY, TOUR_VERSION);
  } catch {
    // Sem armazenamento o tour reaparece no próximo acesso; nunca quebra a tela.
  }
}

/** Só para teste e para o item "refazer" quando quisermos forçar a reexibição. */
export function forgetTour(storage: Pick<Storage, 'removeItem'> | null): void {
  try {
    storage?.removeItem(TOUR_SEEN_KEY);
  } catch {
    // Idem.
  }
}

export function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * O tour não inicia sozinho quando a pessoa chegou por um link com intenção
 * específica — um projeto compartilhado (RF15) ou um link direto para a
 * documentação. Nesses casos ela veio ver outra coisa, e o tour atrapalha.
 */
export function isDeepLink(location: Pick<Location, 'search' | 'hash'>): boolean {
  return location.search.length > 1 || location.hash.length > 1;
}

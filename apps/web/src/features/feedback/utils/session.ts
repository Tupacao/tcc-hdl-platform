/**
 * Identificador anônimo da sessão (RF17, Figma 10.5). É a chave do limite diário
 * no servidor — por sessão, não por endereço, para que um laboratório inteiro
 * atrás do mesmo IP não divida cinco mensagens.
 *
 * Mesmo padrão do `ThemeProvider`: `localStorage` com `try/catch`. Sem
 * armazenamento, cada envio recebe um identificador novo — o limite fica mais
 * frouxo, nunca quebra a tela.
 */
const SESSION_KEY = 'tplab:feedback-session:v1';

function randomId(): string {
  // `randomUUID` não existe em contexto inseguro (http numa máquina da rede).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function readOrCreateSessionId(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
): string {
  const existing = readSessionId(storage);
  if (existing) return existing;

  const created = randomId();
  try {
    storage?.setItem(SESSION_KEY, created);
  } catch {
    // Modo privativo ou armazenamento bloqueado: o identificador vale só para este envio.
  }
  return created;
}

function readSessionId(storage: Pick<Storage, 'getItem'> | null): string | null {
  try {
    const value = storage?.getItem(SESSION_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

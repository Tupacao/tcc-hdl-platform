const KEY = 'tplab:browser-warning-dismissed';

/** "Não volta na mesma sessão": sessionStorage; sem storage (modo privativo) o aviso só reaparece. */
export function readDismissed(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function writeDismissed(storage: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(KEY, '1');
  } catch {
    // Sem armazenamento a faixa apenas volta no próximo carregamento.
  }
}

export function sessionStorageOrNull(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

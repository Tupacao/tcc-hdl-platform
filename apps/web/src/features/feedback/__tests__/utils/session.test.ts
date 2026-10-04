import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readOrCreateSessionId } from '../../utils/session';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    size: () => data.size,
  };
}

test('cria um identificador na primeira vez e o reaproveita depois', () => {
  const storage = fakeStorage();

  const first = readOrCreateSessionId(storage);
  const second = readOrCreateSessionId(storage);

  assert.ok(first.length > 0);
  assert.equal(second, first);
  assert.equal(storage.size(), 1);
});

test('o identificador guardado e versionado na chave', () => {
  const storage = fakeStorage();
  readOrCreateSessionId(storage);

  const stored = storage.getItem('tplab:feedback-session:v1');
  assert.ok(stored && stored.length > 0);
});

test('armazenamento bloqueado nao quebra: devolve um identificador assim mesmo', () => {
  const blocked = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('SecurityError');
    },
  };

  const id = readOrCreateSessionId(blocked);
  assert.ok(id.length > 0);
});

test('sem armazenamento (modo privativo extremo) tambem devolve identificador', () => {
  assert.ok(readOrCreateSessionId(null).length > 0);
});

test('valor vazio guardado e tratado como ausente', () => {
  const storage = fakeStorage({ 'tplab:feedback-session:v1': '' });

  const id = readOrCreateSessionId(storage);
  assert.ok(id.length > 0);
});

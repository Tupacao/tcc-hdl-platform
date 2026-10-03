import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TOUR_VERSION,
  forgetTour,
  hasSeenTour,
  isDeepLink,
  markTourSeen,
} from '../../utils/storage';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    raw: data,
  };
}

const bloqueado = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('SecurityError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

test('primeiro acesso: ninguem viu o tour ainda', () => {
  assert.equal(hasSeenTour(fakeStorage()), false);
});

test('concluir ou pular marca como visto e impede a reexibicao', () => {
  const storage = fakeStorage();

  markTourSeen(storage);

  assert.equal(hasSeenTour(storage), true);
  assert.equal(storage.raw.get('tplab-tour-seen'), TOUR_VERSION);
});

test('a chave e versionada: uma versao nova do roteiro reexibe o tour', () => {
  const storage = fakeStorage({ 'tplab-tour-seen': 'v0' });

  assert.equal(hasSeenTour(storage), false);
});

test('armazenamento bloqueado degrada para "nunca viu", sem lancar', () => {
  assert.equal(hasSeenTour(bloqueado), false);
  assert.doesNotThrow(() => markTourSeen(bloqueado));
  assert.doesNotThrow(() => forgetTour(bloqueado));
});

test('sem armazenamento nenhum (modo privativo extremo) tambem nao quebra', () => {
  assert.equal(hasSeenTour(null), false);
  assert.doesNotThrow(() => markTourSeen(null));
});

test('esquecer o tour permite que ele volte a aparecer sozinho', () => {
  const storage = fakeStorage();
  markTourSeen(storage);

  forgetTour(storage);

  assert.equal(hasSeenTour(storage), false);
});

test('chegada direta na aplicacao nao e link com intencao especifica', () => {
  assert.equal(isDeepLink({ search: '', hash: '' }), false);
  assert.equal(isDeepLink({ search: '?', hash: '#' }), false);
});

test('link compartilhado ou para a documentacao nao dispara o tour sozinho', () => {
  assert.equal(isDeepLink({ search: '?projeto=abc', hash: '' }), true);
  assert.equal(isDeepLink({ search: '', hash: '#documentacao' }), true);
});

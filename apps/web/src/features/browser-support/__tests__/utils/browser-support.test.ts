import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findMissingCapabilities, type CapabilityEnv } from '../../../../lib/browser-support';
import { readDismissed, writeDismissed } from '../../utils/dismissal';

const full: CapabilityEnv = {
  Worker: function Worker() {},
  matchMedia: () => null,
  ResizeObserver: function ResizeObserver() {},
  structuredClone: () => null,
  canvas2d: true,
};

test('navegador com todas as APIs não tem capacidade ausente', () => {
  assert.deepEqual(findMissingCapabilities(full), []);
});

test('lista exatamente as APIs ausentes, sem olhar user agent', () => {
  assert.deepEqual(findMissingCapabilities({ ...full, ResizeObserver: undefined }), [
    'resizeObserver',
  ]);
  assert.deepEqual(
    findMissingCapabilities({ ...full, Worker: undefined, canvas2d: false, structuredClone: 1 }),
    ['worker', 'canvas2d', 'structuredClone'],
  );
});

test('dispensar grava na sessão e ler devolve true; storage que lança degrada para false', () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
  assert.equal(readDismissed(storage), false);
  writeDismissed(storage);
  assert.equal(readDismissed(storage), true);

  const broken = {
    getItem: () => {
      throw new Error('bloqueado');
    },
    setItem: () => {
      throw new Error('bloqueado');
    },
  };
  assert.equal(readDismissed(broken), false);
  assert.doesNotThrow(() => writeDismissed(broken));
  assert.equal(readDismissed(null), false);
});

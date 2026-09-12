import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { WaveSignal } from '../../models/types';
import { getSignalKey, selectDisplayRows } from '../../utils/rows';

function signal(overrides: Partial<WaveSignal>): WaveSignal {
  return { id: '!', name: 'a', scope: 'tb', width: 1, type: 'wire', ...overrides };
}

test('mantem uma linha por id, ignorando reaproveitamentos em escopos aninhados', () => {
  const rows = selectDisplayRows([
    signal({ id: '!', name: 'a', scope: 'tb' }),
    signal({ id: '!', name: 'a', scope: 'tb.dut' }),
    signal({ id: '"', name: 'b', scope: 'tb' }),
  ]);

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.scope),
    ['tb', 'tb'],
  );
});

test('preserva a ordem de primeira ocorrencia', () => {
  const rows = selectDisplayRows([
    signal({ id: '#', name: 'cin' }),
    signal({ id: '!', name: 'a' }),
  ]);

  assert.deepEqual(
    rows.map((r) => r.id),
    ['#', '!'],
  );
});

test('getSignalKey combina escopo e nome, para sobreviver a troca de id entre execucoes', () => {
  assert.equal(getSignalKey(signal({ scope: 'tb', name: 'a' })), 'tb.a');
});

test('getSignalKey sem escopo usa so o nome', () => {
  assert.equal(getSignalKey(signal({ scope: '', name: 'a' })), 'a');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nearestTransitionTime } from '../../utils/cursor';

const transitionsBySignal = new Map([
  [
    'a',
    [
      { time: 0, value: '0' },
      { time: 10, value: '1' },
      { time: 30, value: '0' },
    ],
  ],
  [
    'b',
    [
      { time: 5, value: '1' },
      { time: 20, value: '0' },
    ],
  ],
]);

test('nearestTransitionTime avanca para a proxima transicao de qualquer sinal do conjunto', () => {
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 0, 1), 5);
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 5, 1), 10);
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 10, 1), 20);
});

test('nearestTransitionTime volta para a transicao anterior de qualquer sinal do conjunto', () => {
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 30, -1), 20);
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 20, -1), 10);
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 5, -1), 0);
});

test('nearestTransitionTime devolve null quando ja esta na borda', () => {
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 30, 1), null);
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'b'], 0, -1), null);
});

test('nearestTransitionTime considera so os sinais do conjunto informado', () => {
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a'], 0, 1), 10);
  assert.equal(nearestTransitionTime(transitionsBySignal, [], 0, 1), null);
});

test('nearestTransitionTime ignora ids sem serie de transicoes', () => {
  assert.equal(nearestTransitionTime(transitionsBySignal, ['a', 'inexistente'], 0, 1), 10);
});

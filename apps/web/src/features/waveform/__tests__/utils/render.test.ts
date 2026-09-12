import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSegments, computeTicks, formatBusValue } from '../../utils/render';

test('buildSegments cobre do inicio ate o fim, sem lacunas, para transicoes que comecam em 0', () => {
  const segments = buildSegments(
    [
      { time: 0, value: '0' },
      { time: 10, value: '1' },
    ],
    20,
    1,
  );

  assert.deepEqual(segments, [
    { start: 0, end: 10, value: '0' },
    { start: 10, end: 20, value: '1' },
  ]);
});

test('buildSegments prefixa um segmento desconhecido antes da primeira transicao', () => {
  const segments = buildSegments([{ time: 5, value: '1' }], 10, 1);

  assert.deepEqual(segments, [
    { start: 0, end: 5, value: 'x' },
    { start: 5, end: 10, value: '1' },
  ]);
});

test('buildSegments sem nenhuma transicao produz um unico segmento desconhecido do tamanho da largura', () => {
  const segments = buildSegments([], 10, 4);

  assert.deepEqual(segments, [{ start: 0, end: 10, value: 'xxxx' }]);
});

test('buildSegments sem transicoes e sem duracao (endTime 0) nao produz segmento', () => {
  assert.deepEqual(buildSegments([], 0, 1), []);
});

test('buildSegments descarta uma transicao final exatamente em endTime (largura zero, nada para desenhar)', () => {
  const segments = buildSegments(
    [
      { time: 0, value: '0' },
      { time: 20, value: '1' },
    ],
    20,
    1,
  );

  assert.deepEqual(segments, [{ start: 0, end: 20, value: '0' }]);
});

test('computeTicks produz passos redondos (1/2/5 x 10^n) cobrindo o viewport', () => {
  const ticks = computeTicks({ startTime: 0, endTime: 100, pixelsPerTime: 5 }, 500);

  assert.deepEqual(ticks, [0, 20, 40, 60, 80, 100]);
});

test('computeTicks com range degenerado nao lanca excecao', () => {
  assert.deepEqual(computeTicks({ startTime: 0, endTime: 0, pixelsPerTime: 1 }, 500), [0]);
  assert.deepEqual(computeTicks({ startTime: 0, endTime: 100, pixelsPerTime: 1 }, 0), [0]);
});

test('formatBusValue mostra o valor literal, sem converter para hexadecimal (Figma 5.1: "0011", "10xx")', () => {
  assert.deepEqual(formatBusValue('0011'), { text: '0011', hasUnknown: false, isHighZ: false });
  assert.deepEqual(formatBusValue('1111'), { text: '1111', hasUnknown: false, isHighZ: false });
});

test('formatBusValue reconhece bits parcialmente indefinidos e preserva o texto com os x', () => {
  assert.deepEqual(formatBusValue('10xx'), { text: '10xx', hasUnknown: true, isHighZ: false });
});

test('formatBusValue reconhece alta impedancia so quando nao ha nenhum bit indefinido', () => {
  assert.deepEqual(formatBusValue('zzzz'), { text: 'zzzz', hasUnknown: false, isHighZ: true });
  assert.deepEqual(formatBusValue('xzzz'), { text: 'xzzz', hasUnknown: true, isHighZ: false });
});

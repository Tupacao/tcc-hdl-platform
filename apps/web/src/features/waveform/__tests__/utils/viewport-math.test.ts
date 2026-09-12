import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampRange, panRange, zoomRangeAt } from '../../utils/viewport-math';

test('clampRange mantem o intervalo dentro de [0, total] e nao deixa o vao menor que minSpan', () => {
  assert.deepEqual(clampRange(10, 20, 100, 1), { startTime: 10, endTime: 20 });
  assert.deepEqual(clampRange(-5, 5, 100, 1), { startTime: 0, endTime: 10 });
  assert.deepEqual(clampRange(95, 105, 100, 1), { startTime: 90, endTime: 100 });
});

test('clampRange expande um vao menor que minSpan em vez de encolher para zero', () => {
  const result = clampRange(50, 50.1, 100, 5);
  assert.equal(result.endTime - result.startTime, 5);
});

test('clampRange nunca deixa o vao maior que o total', () => {
  const result = clampRange(-50, 150, 100, 1);
  assert.equal(result.startTime, 0);
  assert.equal(result.endTime, 100);
});

test('zoomRangeAt aproxima mantendo o ponto do cursor fixo', () => {
  const current = { startTime: 0, endTime: 100 };
  const result = zoomRangeAt(current, 25, 2, 1000, 0.01);
  // Zoom 2x: vao cai de 100 para 50. O ponto (25) fica a 1/4 do vao original
  // (25 de 100), entao continua a 1/4 do novo vao (12.5 de 50): 12.5..62.5.
  assert.equal(result.endTime - result.startTime, 50);
  assert.equal(result.startTime, 12.5);
  assert.equal(result.endTime, 62.5);
});

test('zoomRangeAt para fora (factor < 1) alarga o vao', () => {
  const current = { startTime: 40, endTime: 60 };
  const result = zoomRangeAt(current, 50, 0.5, 1000, 0.01);
  assert.equal(result.endTime - result.startTime, 40);
});

test('zoomRangeAt respeita o piso de zoom (minSpan) e o total', () => {
  const current = { startTime: 0, endTime: 10 };
  const result = zoomRangeAt(current, 5, 1000, 100, 5);
  assert.ok(Math.abs(result.endTime - result.startTime - 5) < 1e-9);
});

test('panRange desloca sem alterar o tamanho do vao, dentro dos limites', () => {
  const current = { startTime: 10, endTime: 30 };
  assert.deepEqual(panRange(current, 5, 100, 1), { startTime: 15, endTime: 35 });
  assert.deepEqual(panRange(current, -20, 100, 1), { startTime: 0, endTime: 20 });
});

test('panRange nao deixa passar do fim quando desloca para frente', () => {
  const current = { startTime: 80, endTime: 100 };
  const result = panRange(current, 50, 100, 1);
  assert.equal(result.endTime - result.startTime, 20);
  assert.equal(result.endTime, 100);
});

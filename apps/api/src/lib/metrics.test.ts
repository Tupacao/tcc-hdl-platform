import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMetricsHash } from './metrics.js';

test('parseMetricsHash devolve zeros/nulo quando o hash esta vazio (nenhum job ainda)', () => {
  const metrics = parseMetricsHash({});
  assert.deepEqual(metrics, {
    totalJobs: 0,
    succeededJobs: 0,
    failedJobs: 0,
    failuresByType: {},
    averageDurationMs: null,
  });
});

test('parseMetricsHash separa sucesso e falhas por tipo, e calcula a duracao media', () => {
  const metrics = parseMetricsHash({
    total: '5',
    succeeded: '3',
    'failure:compile_error': '1',
    'failure:timeout': '1',
    durationMsSum: '10000',
  });

  assert.equal(metrics.totalJobs, 5);
  assert.equal(metrics.succeededJobs, 3);
  assert.equal(metrics.failedJobs, 2);
  assert.deepEqual(metrics.failuresByType, { compile_error: 1, timeout: 1 });
  assert.equal(metrics.averageDurationMs, 2000);
});

test('parseMetricsHash ignora campos que nao comecam com failure:', () => {
  const metrics = parseMetricsHash({
    total: '1',
    succeeded: '1',
    durationMsSum: '100',
    outroCampo: '9',
  });
  assert.deepEqual(metrics.failuresByType, {});
});

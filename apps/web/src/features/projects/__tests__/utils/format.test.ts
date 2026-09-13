import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatRelativeTime } from '../../utils/format';

const NOW = new Date('2026-01-10T12:00:00.000Z');

test('formatRelativeTime descreve segundos atras', () => {
  const then = new Date(NOW.getTime() - 5_000).toISOString();
  assert.match(formatRelativeTime(then, NOW), /5 segundos/);
});

test('formatRelativeTime descreve horas atras', () => {
  const then = new Date(NOW.getTime() - 5 * 60 * 60 * 1000).toISOString();
  assert.match(formatRelativeTime(then, NOW), /5 horas/);
});

test('formatRelativeTime descreve "ontem" para ~24h atras', () => {
  const then = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
  assert.match(formatRelativeTime(then, NOW), /ontem/i);
});

test('formatRelativeTime vira data absoluta depois de ~30 dias', () => {
  const then = new Date(NOW.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const result = formatRelativeTime(then, NOW);
  assert.doesNotMatch(result, /dias/);
});

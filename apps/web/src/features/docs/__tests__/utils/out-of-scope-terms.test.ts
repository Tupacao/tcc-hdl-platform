import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findOutOfScopeMatch } from '../../utils/out-of-scope-terms';

test('findOutOfScopeMatch reconhece always_ff e sugere o equivalente em Verilog', () => {
  assert.deepEqual(findOutOfScopeMatch('always_ff'), {
    term: 'always_ff',
    verilogEquivalent: 'always @(posedge clk)',
  });
});

test('findOutOfScopeMatch normaliza maiusculas e espacos', () => {
  assert.deepEqual(findOutOfScopeMatch('Always FF'), {
    term: 'always_ff',
    verilogEquivalent: 'always @(posedge clk)',
  });
});

test('findOutOfScopeMatch devolve null para termo desconhecido', () => {
  assert.equal(findOutOfScopeMatch('modulo'), null);
});

test('findOutOfScopeMatch devolve null para busca vazia', () => {
  assert.equal(findOutOfScopeMatch('   '), null);
});

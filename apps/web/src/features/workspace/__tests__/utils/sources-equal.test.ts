import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HdlSources } from '@tplab/shared';
import { sourcesEqual } from '../../utils/sources-equal';

const base: HdlSources = {
  language: 'verilog',
  topModule: 'contador_tb',
  design: { name: 'contador.v', content: 'module contador(); endmodule' },
  testbench: { name: 'contador_tb.v', content: 'module contador_tb(); endmodule' },
};

test('sourcesEqual e verdadeiro para o mesmo conteudo em objetos diferentes', () => {
  assert.equal(sourcesEqual(base, { ...base }), true);
});

test('sourcesEqual detecta diferenca no conteudo do design', () => {
  const changed: HdlSources = { ...base, design: { ...base.design, content: 'outro conteudo' } };
  assert.equal(sourcesEqual(base, changed), false);
});

test('sourcesEqual detecta diferenca no conteudo do testbench', () => {
  const changed: HdlSources = {
    ...base,
    testbench: { ...base.testbench, content: 'outro conteudo' },
  };
  assert.equal(sourcesEqual(base, changed), false);
});

test('sourcesEqual detecta diferenca no nome de arquivo', () => {
  const changed: HdlSources = { ...base, design: { ...base.design, name: 'outro.v' } };
  assert.equal(sourcesEqual(base, changed), false);
});

test('sourcesEqual detecta diferenca no modulo de topo', () => {
  const changed: HdlSources = { ...base, topModule: 'outro_tb' };
  assert.equal(sourcesEqual(base, changed), false);
});

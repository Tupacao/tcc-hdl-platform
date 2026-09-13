import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBlankSources, buildSampleSources } from '../../utils/project-sources';

test('buildBlankSources nomeia arquivos e modulos a partir do nome do projeto', () => {
  const sources = buildBlankSources('meu_projeto');

  assert.equal(sources.design.name, 'meu_projeto.v');
  assert.equal(sources.testbench.name, 'meu_projeto_tb.v');
  assert.equal(sources.topModule, 'meu_projeto_tb');
  assert.match(sources.design.content, /module meu_projeto/);
  assert.match(sources.testbench.content, /module meu_projeto_tb/);
});

test('buildSampleSources renomeia o exemplo padrao para o nome escolhido', () => {
  const sources = buildSampleSources('somador_x');

  assert.equal(sources.design.name, 'somador_x.v');
  assert.equal(sources.testbench.name, 'somador_x_tb.v');
  assert.doesNotMatch(sources.design.content, /full_adder/);
  assert.doesNotMatch(sources.testbench.content, /full_adder/);
  assert.match(sources.testbench.content, /somador_x dut/);
});

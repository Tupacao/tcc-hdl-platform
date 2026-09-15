import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DocSection, DocSectionContentProps } from '../../models/types';
import { filterSections } from '../../utils/search';

function StubComponent(_props: DocSectionContentProps) {
  return null;
}

const sections: DocSection[] = [
  {
    id: 'exemplo-somador',
    category: 'inicio-rapido',
    title: 'Exemplo: somador completo',
    summary: 'Um circuito combinacional simples, com testbench comentado.',
    Component: StubComponent,
  },
  {
    id: 'atalhos',
    category: 'ajuda',
    title: 'Atalhos de teclado',
    summary: 'Lista de teclas rapidas do editor e do workspace.',
    Component: StubComponent,
  },
];

test('filterSections sem busca devolve todas as secoes', () => {
  assert.deepEqual(filterSections(sections, ''), sections);
});

test('filterSections filtra pelo titulo, sem diferenciar maiusculas', () => {
  assert.deepEqual(filterSections(sections, 'SOMADOR'), [sections[0]]);
});

test('filterSections filtra pelo resumo', () => {
  assert.deepEqual(filterSections(sections, 'teclas rapidas'), [sections[1]]);
});

test('filterSections sem correspondencia devolve lista vazia', () => {
  assert.deepEqual(filterSections(sections, 'nao existe'), []);
});

test('filterSections ignora espacos nas pontas da busca', () => {
  assert.deepEqual(filterSections(sections, '  somador  '), [sections[0]]);
});

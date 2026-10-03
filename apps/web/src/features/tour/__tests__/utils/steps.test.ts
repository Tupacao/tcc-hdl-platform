import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TOUR_ANCHORS } from '../../utils/anchors';
import { TOUR_STEPS, availableSteps, formatStepCounter, type TourStep } from '../../utils/steps';

/** `ParentNode` mínimo: o teste roda em node:test, sem DOM. */
function fakeRoot(presentAnchors: string[]) {
  return {
    querySelector(selector: string) {
      const anchor = /\[data-tour="(.+)"\]/.exec(selector)?.[1];
      return anchor && presentAnchors.includes(anchor) ? ({} as Element) : null;
    },
  } as unknown as ParentNode;
}

const TODAS = Object.values(TOUR_ANCHORS);

test('o roteiro cobre o fluxo de trabalho na ordem (RF16)', () => {
  assert.deepEqual(
    TOUR_STEPS.map((step) => step.anchor),
    ['editor', 'file-tabs', 'run-button', 'console', 'waveform'],
  );
});

test('todo passo tem titulo e texto proprios', () => {
  for (const step of TOUR_STEPS) {
    assert.ok(step.title.length > 0, `passo ${step.anchor} sem titulo`);
    assert.ok(step.body.length > 20, `passo ${step.anchor} com texto curto demais`);
  }
});

test('os textos usam o vocabulario do glossario', () => {
  const texto = TOUR_STEPS.map((step) => `${step.title} ${step.body}`).join(' ');

  assert.match(texto, /circuito/);
  assert.match(texto, /testbench/);
  assert.match(texto, /forma[s]? de onda/);
  // Termos proibidos pelo glossario (docs/GLOSSARIO.md).
  assert.doesNotMatch(texto, /\bdesign\b|\bwaveform\b|\bdiagnóstico\b|\brodar\b/i);
});

test('todas as ancoras presentes: nenhum passo e pulado', () => {
  const steps = availableSteps(TOUR_STEPS, fakeRoot([...TODAS]));

  assert.equal(steps.length, TOUR_STEPS.length);
});

test('ancora ausente e passo pulado, com aviso — nunca erro', () => {
  const avisos: string[] = [];
  const steps = availableSteps(
    TOUR_STEPS,
    fakeRoot(TODAS.filter((anchor) => anchor !== 'waveform')),
    (message) => avisos.push(message),
  );

  assert.equal(steps.length, TOUR_STEPS.length - 1);
  assert.ok(!steps.some((step) => step.anchor === 'waveform'));
  assert.equal(avisos.length, 1);
  assert.match(avisos[0] ?? '', /waveform/);
});

test('nenhuma ancora na tela devolve lista vazia, sem lancar', () => {
  assert.deepEqual(availableSteps(TOUR_STEPS, fakeRoot([])), []);
});

test('o contador do balao conta a partir de 1', () => {
  assert.equal(formatStepCounter(1, 5), '1 de 5');
  assert.equal(formatStepCounter(5, 5), '5 de 5');
});

test('o contador acompanha o roteiro realmente exibido, nao o total fixo', () => {
  const steps: TourStep[] = availableSteps(TOUR_STEPS, fakeRoot(['editor', 'run-button']));

  assert.equal(formatStepCounter(2, steps.length), '2 de 2');
});

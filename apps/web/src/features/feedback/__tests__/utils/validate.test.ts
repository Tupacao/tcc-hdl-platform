import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FEEDBACK_MESSAGE_MIN, type CreateFeedback } from '@tplab/shared';
import { canSubmit, validateFeedback } from '../../utils/validate';

function relato(overrides: Partial<CreateFeedback> = {}): CreateFeedback {
  return {
    kind: 'problema',
    message: 'A forma de onda nao aparece depois de executar o somador.',
    ...overrides,
  };
}

test('relato valido nao produz erro de campo', () => {
  assert.deepEqual(validateFeedback(relato()), {});
});

test('a mensagem de erro vem do schema compartilhado, em portugues', () => {
  const errors = validateFeedback(relato({ message: 'quebrou' }));

  assert.match(errors.message ?? '', /ao menos 20 caracteres/);
  assert.equal(errors.contact, undefined);
});

test('contato invalido e apontado no proprio campo', () => {
  const errors = validateFeedback(relato({ contact: 'nao-e-email' }));

  assert.match(errors.contact ?? '', /e-mail válido/);
  assert.equal(errors.message, undefined);
});

test('contato vazio e ausente sao aceitos — ninguem precisa se identificar', () => {
  assert.deepEqual(validateFeedback(relato({ contact: null })), {});
  assert.deepEqual(validateFeedback(relato()), {});
});

test('o botao Enviar so acende a partir do minimo do schema', () => {
  assert.equal(canSubmit('a'.repeat(FEEDBACK_MESSAGE_MIN - 1)), false);
  assert.equal(canSubmit('a'.repeat(FEEDBACK_MESSAGE_MIN)), true);
});

test('espaco em branco nao conta para acender o botao', () => {
  assert.equal(canSubmit(`   ${'a'.repeat(FEEDBACK_MESSAGE_MIN - 1)}   `), false);
  assert.equal(canSubmit('                                   '), false);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toJobStatus } from '../../application/simulation/repository/bullmq-simulation-job.repository.js';

/**
 * O contrato publico (`JobStatusSchema`) tem quatro estados; o BullMQ tem mais.
 * Esse mapeamento e o unico ponto onde os dois se encontram — um estado novo do
 * BullMQ cair no lugar errado aparece como "fila" quando o job ja terminou.
 */
test('estados do BullMQ viram os quatro estados publicos do contrato', () => {
  assert.equal(toJobStatus('completed'), 'succeeded');
  assert.equal(toJobStatus('failed'), 'failed');
  assert.equal(toJobStatus('active'), 'running');
  assert.equal(toJobStatus('waiting'), 'queued');
  assert.equal(toJobStatus('delayed'), 'queued');
  assert.equal(toJobStatus('waiting-children'), 'queued');
  assert.equal(toJobStatus('prioritized'), 'queued');
  // Estado desconhecido nunca pode virar sucesso: na duvida, o job ainda espera.
  assert.equal(toJobStatus('estado-novo-do-bullmq'), 'queued');
});

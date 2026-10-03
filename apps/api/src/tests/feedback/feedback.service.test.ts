import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CreateFeedback } from '@tplab/shared';
import { InMemoryFeedbackRepository } from '../../application/feedback/repository/in-memory-feedback.repository.js';
import { DefaultFeedbackService } from '../../application/feedback/service/feedback.service.js';
import { FeedbackDailyLimitError } from '../../domain/feedback/entities/feedback-error.js';
import type { NewFeedback } from '../../domain/feedback/entities/feedback.js';

const SALT = 'sal-fixo-de-teste-com-tamanho-ok';
const IP = '203.0.113.7';

function relato(overrides: Partial<CreateFeedback> = {}): CreateFeedback {
  return {
    kind: 'problema',
    message: 'A forma de onda nao aparece depois de executar o somador.',
    ...overrides,
  };
}

function build(maxPerDay = 5) {
  const repository = new InMemoryFeedbackRepository();
  return { repository, service: new DefaultFeedbackService(repository, maxPerDay, SALT) };
}

test('grava o relato e devolve so o recibo (nada do texto volta)', async () => {
  const { repository, service } = build();

  const receipt = await service.submit(relato({ contact: 'aluno@exemplo.com' }), { ip: IP });

  assert.ok(receipt.id.length > 0);
  assert.doesNotThrow(() => new Date(receipt.receivedAt).toISOString());
  assert.deepEqual(Object.keys(receipt).sort(), ['id', 'receivedAt']);

  const [stored] = await repository.list();
  assert.equal(stored?.message, relato().message);
  assert.equal(stored?.contact, 'aluno@exemplo.com');
});

test('o IP nunca e gravado em claro, so o hash com sal', async () => {
  const { repository, service } = build();

  await service.submit(relato(), { ip: IP });

  const [stored] = await repository.list();
  assert.notEqual(stored?.ipHash, IP);
  assert.match(stored?.ipHash ?? '', /^[0-9a-f]{64}$/);
  // Sal diferente, hash diferente: o hash nao e reversivel a partir do IP sozinho.
  const outro = new DefaultFeedbackService(new InMemoryFeedbackRepository(), 5, 'outro-sal-aqui');
  const receipt = await outro.submit(relato(), { ip: IP });
  assert.ok(receipt.id);
});

test('contato e contexto ausentes viram null, nunca undefined', async () => {
  const { repository, service } = build();

  await service.submit(relato(), { ip: IP });

  const [stored] = await repository.list();
  assert.equal(stored?.contact, null);
  assert.equal(stored?.context, null);
  assert.equal(stored?.userId, null);
});

test('o contexto tecnico enviado e preservado como veio do schema', async () => {
  const { repository, service } = build();
  const context = { userAgent: 'Mozilla/5.0', viewport: '1440x900', lastFailure: 'timeout' };

  await service.submit(relato({ context }), { ip: IP });

  const [stored] = await repository.list();
  assert.deepEqual(stored?.context, context);
});

test('o sexto envio da mesma origem no dia e recusado (RF17)', async () => {
  const { service } = build();

  for (let i = 0; i < 5; i++) await service.submit(relato(), { ip: IP });

  await assert.rejects(
    () => service.submit(relato(), { ip: IP }),
    (error: unknown) => {
      assert.ok(error instanceof FeedbackDailyLimitError);
      assert.equal(error.limit, 5);
      return true;
    },
  );
});

test('o limite e por origem: outro IP continua podendo enviar', async () => {
  const { service } = build();

  for (let i = 0; i < 5; i++) await service.submit(relato(), { ip: IP });

  const receipt = await service.submit(relato(), { ip: '198.51.100.4' });
  assert.ok(receipt.id);
});

test('relato de mais de 24h nao conta para o limite do dia', async () => {
  const repository = new InMemoryFeedbackRepository();
  const service = new DefaultFeedbackService(repository, 1, SALT);

  await service.submit(relato(), { ip: IP });
  // Envelhece o unico relato para alem da janela de 24h.
  const [stored] = await repository.list();
  (stored as { createdAt: Date }).createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

  const receipt = await service.submit(relato(), { ip: IP });
  assert.ok(receipt.id);
});

test('sem IP nao ha limite diario a aplicar (fica com a guarda da rota)', async () => {
  const { service } = build(1);

  await service.submit(relato(), { ip: null });
  const receipt = await service.submit(relato(), { ip: null });

  assert.ok(receipt.id);
});

test('o usuario autenticado, quando houver (RF14), e gravado no relato', async () => {
  const { repository, service } = build();

  await service.submit(relato(), { ip: IP, userId: 'user-123' });

  const [stored] = await repository.list();
  assert.equal(stored?.userId, 'user-123');
});

test('o repositorio conta apenas a origem pedida', async () => {
  const repository = new InMemoryFeedbackRepository();
  const base: NewFeedback = {
    kind: 'outro',
    message: 'mensagem de teste com tamanho suficiente',
    contact: null,
    context: null,
    userId: null,
    ipHash: 'hash-a',
  };

  await repository.create(base);
  await repository.create({ ...base, ipHash: 'hash-b' });

  assert.equal(await repository.countSince('hash-a', new Date(Date.now() - 1000)), 1);
  assert.equal(await repository.countSince('hash-b', new Date(Date.now() - 1000)), 1);
  assert.equal(await repository.countSince('hash-c', new Date(Date.now() - 1000)), 0);
});

import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import type { LightMyRequestResponse } from 'fastify';
import { FeedbackReceiptSchema } from '@tplab/shared';
import { buildApp } from '../../app.js';
import { simulationQueue } from '../../infra/queue/simulation.queue.js';

// Mesma razao de `tests/simulation/simulation.controller.test.ts`: importar
// `app.js` cria a fila BullMQ, cuja conexao "shared" com o Redis nao e encerrada
// por `Queue#close()` — sem isso o processo de teste nunca sairia sozinho.
after(() => {
  const rawClient = (
    simulationQueue as unknown as { connection: { _client: { disconnect: () => void } } }
  ).connection._client;
  rawClient.disconnect();
});

/**
 * Cobre RF17-I01 na borda HTTP. Sem `DATABASE_URL` no ambiente de teste, `app.ts`
 * injeta o repositorio em memoria — cada `buildApp()` comeca com a cota do dia
 * zerada, entao os casos nao interferem uns nos outros.
 */
function relato(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'problema',
    message: 'O console nao mostra o erro de compilacao do testbench.',
    ...overrides,
  };
}

async function post(body: Record<string, unknown>): Promise<LightMyRequestResponse> {
  const app = await buildApp();
  try {
    return await app.inject({ method: 'POST', url: '/api/feedback', payload: body });
  } finally {
    await app.close();
  }
}

test('POST /api/feedback aceita um envio valido e devolve 201 com o recibo', async () => {
  const response = await post(relato({ contact: 'aluno@exemplo.com' }));

  assert.equal(response.statusCode, 201);
  const receipt = FeedbackReceiptSchema.parse(response.json());
  assert.ok(receipt.id.length > 0);
});

test('mensagem curta demais retorna 400 em portugues', async () => {
  const response = await post(relato({ message: 'quebrou' }));

  assert.equal(response.statusCode, 400);
  assert.match(response.json().message, /ao menos 20 caracteres/);
});

test('mensagem longa demais retorna 400 em portugues', async () => {
  const response = await post(relato({ message: 'a'.repeat(2001) }));

  assert.equal(response.statusCode, 400);
  assert.match(response.json().message, /excede 2000 caracteres/);
});

test('contato invalido retorna 400 e nada e gravado', async () => {
  const response = await post(relato({ contact: 'nao-e-email' }));

  assert.equal(response.statusCode, 400);
  assert.match(response.json().message, /e-mail válido/);
});

test('tipo de relato desconhecido retorna 400', async () => {
  const response = await post(relato({ kind: 'reclamacao' }));

  assert.equal(response.statusCode, 400);
  assert.match(response.json().message, /tipo de relato/);
});

test('envio sem contexto tecnico e aceito', async () => {
  const response = await post(relato({ context: null }));

  assert.equal(response.statusCode, 201);
});

test('campo desconhecido no contexto e descartado, nao recusado', async () => {
  const response = await post(
    relato({ context: { userAgent: 'Mozilla/5.0', codigoDoUsuario: 'module tb; endmodule' } }),
  );

  assert.equal(response.statusCode, 201);
});

test('o sexto envio do dia retorna 429 com a mensagem do limite diario', async () => {
  const app = await buildApp();
  try {
    for (let i = 0; i < 5; i++) {
      const ok = await app.inject({ method: 'POST', url: '/api/feedback', payload: relato() });
      assert.equal(ok.statusCode, 201);
    }

    const blocked = await app.inject({
      method: 'POST',
      url: '/api/feedback',
      payload: relato(),
    });

    assert.equal(blocked.statusCode, 429);
    assert.match(blocked.json().message, /já enviou 5 mensagens hoje/);
  } finally {
    await app.close();
  }
});

test('tentativa invalida nao consome a cota do dia', async () => {
  const app = await buildApp();
  try {
    for (let i = 0; i < 6; i++) {
      const invalid = await app.inject({
        method: 'POST',
        url: '/api/feedback',
        payload: relato({ message: 'curto' }),
      });
      assert.equal(invalid.statusCode, 400);
    }

    const accepted = await app.inject({
      method: 'POST',
      url: '/api/feedback',
      payload: relato(),
    });

    assert.equal(accepted.statusCode, 201);
  } finally {
    await app.close();
  }
});

test('nao existe rota publica de leitura do feedback', async () => {
  const app = await buildApp();
  try {
    for (const url of ['/api/feedback', '/api/feedbacks']) {
      const response = await app.inject({ method: 'GET', url });
      assert.equal(response.statusCode, 404);
    }
  } finally {
    await app.close();
  }
});

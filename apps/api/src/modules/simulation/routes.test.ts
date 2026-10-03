import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { MAX_SOURCE_BYTES } from '@tplab/shared';
import { buildApp } from '../../app.js';
import { simulationQueue } from './queue.js';

// Importar `app.js` carrega `simulationQueue` (modules/simulation/queue.ts),
// que abre uma conexao "shared" com o Redis (ver `lib/redis.ts`) e, sem
// Redis no ar, fica tentando reconectar indefinidamente — deliberado, para a
// API nao cair so por falta de Redis. O BullMQ nao encerra conexoes
// "shared" em `Queue#close()` (assume que quem criou a conexao e dono do seu
// ciclo de vida), entao sem isso o processo de teste nunca sairia sozinho.
// `disconnect()` do ioredis e sincrono e para os timers de reconexao na hora,
// sem depender de uma conexao que nunca vai ficar pronta.
after(() => {
  const rawClient = (
    simulationQueue as unknown as { connection: { _client: { disconnect: () => void } } }
  ).connection._client;
  rawClient.disconnect();
});

/**
 * Cobre RF03-I01: submissoes fora dos limites devem ser rejeitadas antes de
 * enfileirar (400/413), com mensagem em portugues. Nenhum destes casos passa
 * pela validacao do schema, entao a fila (e o Redis) nunca entram em jogo —
 * por isso os testes rodam sem Redis disponivel.
 */
function validCompileRequestBody() {
  return {
    topModule: 'tb',
    design: { name: 'design.v', content: 'module top(); endmodule' },
    testbench: { name: 'tb.v', content: 'module tb(); endmodule' },
  };
}

test('POST /api/simulations com extensao de arquivo invalida retorna 400 em portugues', async () => {
  const app = await buildApp();
  const body = validCompileRequestBody();
  body.design = { name: 'design.txt', content: 'module top(); endmodule' };

  const response = await app.inject({ method: 'POST', url: '/api/simulations', payload: body });

  assert.equal(response.statusCode, 400);
  const payload = response.json();
  assert.equal(payload.message, 'O arquivo deve ter extensão .v ou .sv');

  await app.close();
});

test('POST /api/simulations com conteudo acima de MAX_SOURCE_BYTES retorna 400, sem criar job', async () => {
  const app = await buildApp();
  const body = validCompileRequestBody();
  body.design = { name: 'design.v', content: 'a'.repeat(MAX_SOURCE_BYTES + 1) };

  const response = await app.inject({ method: 'POST', url: '/api/simulations', payload: body });

  assert.equal(response.statusCode, 400);
  const payload = response.json();
  assert.match(payload.message, /excede o limite/);

  await app.close();
});

test('POST /api/simulations com topModule vazio retorna 400 em portugues', async () => {
  const app = await buildApp();
  const body = validCompileRequestBody();
  body.topModule = '';

  const response = await app.inject({ method: 'POST', url: '/api/simulations', payload: body });

  assert.equal(response.statusCode, 400);
  const payload = response.json();
  assert.equal(payload.message, 'O nome do módulo principal é obrigatório');

  await app.close();
});

test('POST /api/simulations com corpo acima do bodyLimit retorna 413 com JSON valido', async () => {
  const app = await buildApp();
  // Corpo cru bem maior que qualquer combinacao valida de design + testbench;
  // o limite de bytes e verificado antes do parse/validacao do schema.
  const oversizedPayload = 'x'.repeat(MAX_SOURCE_BYTES * 2 * 4 + 1024);

  const response = await app.inject({
    method: 'POST',
    url: '/api/simulations',
    payload: oversizedPayload,
    headers: { 'content-type': 'application/json' },
  });

  assert.equal(response.statusCode, 413);
  const payload = response.json();
  assert.equal(payload.statusCode, 413);
  assert.equal(
    payload.message,
    'O código enviado excede o limite permitido. Reduza o tamanho dos arquivos e execute novamente.',
  );

  await app.close();
});

/**
 * Cobre RF03-I02: limite de 10 submissoes/min por origem em POST
 * /api/simulations. O corpo enviado e deliberadamente invalido (`topModule`
 * vazio) — o hook de rate limit roda em `onRequest`, antes da validacao do
 * corpo, entao o teto e contado igual com um corpo que nunca chegaria a
 * enfileirar nada (evita depender de Redis, indisponivel neste ambiente).
 */
test('POST /api/simulations: a 11a submissao no mesmo minuto retorna 429 com Retry-After', async () => {
  const app = await buildApp();
  const body = validCompileRequestBody();
  body.topModule = '';

  for (let i = 0; i < 10; i += 1) {
    const response = await app.inject({ method: 'POST', url: '/api/simulations', payload: body });
    assert.equal(response.statusCode, 400, `submissao ${i + 1} deveria falhar por validacao`);
  }

  const eleventh = await app.inject({ method: 'POST', url: '/api/simulations', payload: body });

  assert.equal(eleventh.statusCode, 429);
  assert.ok(eleventh.headers['retry-after'], 'esperava o cabecalho Retry-After');
  const payload = eleventh.json();
  assert.equal(payload.statusCode, 429);
  assert.equal(payload.error, 'Too Many Requests');
  assert.equal(typeof payload.message, 'string');

  await app.close();
});

test('POST /api/simulations sob rate limit nao afeta GET /api/projects', async () => {
  const app = await buildApp();
  const body = validCompileRequestBody();
  body.topModule = '';

  for (let i = 0; i < 11; i += 1) {
    await app.inject({ method: 'POST', url: '/api/simulations', payload: body });
  }

  const projects = await app.inject({ method: 'GET', url: '/api/projects' });
  assert.equal(projects.statusCode, 200);

  await app.close();
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  demuxDockerLogs,
  extractStageTimings,
  mapFailure,
  readContainerLogs,
  timeoutPhaseOf,
  truncateAtLineBoundary,
  truncateFromEnd,
} from './sandbox.js';

test('truncateAtLineBoundary devolve o conteudo intacto quando cabe no limite', () => {
  const content = 'linha 1\nlinha 2\n';
  assert.deepEqual(truncateAtLineBoundary(content, content.length), {
    text: content,
    truncated: false,
  });
  assert.equal(truncateAtLineBoundary(content, content.length + 10).truncated, false);
});

test('truncateAtLineBoundary corta no ultimo \\n dentro do limite, nunca no meio de uma linha', () => {
  const content = 'linha 1\nlinha 2\nlinha 3\n';
  // Limite cai no meio de "linha 2" — deve voltar para o fim de "linha 1".
  const result = truncateAtLineBoundary(content, 12);
  assert.equal(result.text, 'linha 1\n');
  assert.equal(result.truncated, true);
  assert.ok(result.text.endsWith('\n'));
});

test('truncateAtLineBoundary sem newline antes do limite corta no byte exato', () => {
  const content = 'semquebrasdelinhaaqui';
  const result = truncateAtLineBoundary(content, 5);
  assert.equal(result.text, content.slice(0, 5));
  assert.equal(result.truncated, true);
});

test('truncateFromEnd devolve o texto intacto quando cabe no limite', () => {
  const text = 'saida curta';
  assert.deepEqual(truncateFromEnd(text, 100), { text, truncated: false });
});

test('truncateFromEnd mantem as ultimas linhas e avisa quantos bytes foram descartados', () => {
  const text = 'AAAA\nBBBB\nCCCC\nDDDD\n';
  // Corte cai no meio de "BBBB" — deve recuar para o inicio de "CCCC".
  const result = truncateFromEnd(text, 12);
  assert.equal(result.truncated, true);
  assert.match(result.text, /^\[8 bytes descartados do inicio\]\n/);
  assert.ok(result.text.endsWith('CCCC\nDDDD\n'));
  assert.ok(!result.text.includes('AAAA'));
  assert.ok(!result.text.includes('BBBB'));
});

test('truncateFromEnd sem quebra de linha no trecho mantido preserva o texto', () => {
  const text = 'a'.repeat(100);
  const result = truncateFromEnd(text, 10);
  assert.equal(result.truncated, true);
  assert.match(result.text, /^\[90 bytes descartados do inicio\]\n/);
  assert.ok(result.text.endsWith('a'.repeat(10)));
});

test('demuxDockerLogs separa stdout e stderr dos frames multiplexados', () => {
  const header = (streamType: number, length: number) => {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt8(streamType, 0);
    buffer.writeUInt32BE(length, 4);
    return buffer;
  };
  const out = Buffer.from('ola\n');
  const err = Buffer.from('falha\n');
  const frames = Buffer.concat([header(1, out.length), out, header(2, err.length), err]);

  const { stdout, stderr } = demuxDockerLogs(frames);
  assert.equal(stdout, 'ola\n');
  assert.equal(stderr, 'falha\n');
});

// RNF05-I01 — mapFailure: cada combinacao de codigo de saida e OOMKilled, sem Docker.

const NO_OOM = { oomKilled: false };
const OOM = { oomKilled: true };

test('mapFailure: codigos do script sem OOM', () => {
  assert.equal(mapFailure(0, NO_OOM), null);
  assert.equal(mapFailure(2, NO_OOM), 'compile_error');
  assert.equal(mapFailure(3, NO_OOM), 'runtime_error');
  assert.equal(mapFailure(153, NO_OOM), 'runtime_error');
  assert.equal(mapFailure(4, NO_OOM), 'timeout');
  assert.equal(mapFailure(124, NO_OOM), 'timeout');
});

test('mapFailure: OOMKilled e o dado autoritativo de memoria, qualquer que seja o codigo de saida', () => {
  for (const exitCode of [0, 2, 3, 4, 124, 137, 1]) {
    assert.equal(mapFailure(exitCode, OOM), 'memory_limit', `exit ${exitCode}`);
  }
});

test('mapFailure: 137 sem OOMKilled (SIGKILL de outra causa) NAO e memory_limit', () => {
  assert.equal(mapFailure(137, NO_OOM), 'internal_error');
});

test('mapFailure: codigo desconhecido e erro interno, nunca culpa o usuario', () => {
  assert.equal(mapFailure(1, NO_OOM), 'internal_error');
  assert.equal(mapFailure(255, NO_OOM), 'internal_error');
});

test('timeoutPhaseOf distingue compilacao, simulacao e o killTimer do host', () => {
  assert.equal(timeoutPhaseOf(4, false), 'compile');
  assert.equal(timeoutPhaseOf(124, false), 'simulate');
  assert.equal(timeoutPhaseOf(124, true), 'host');
  assert.equal(timeoutPhaseOf(2, false), null);
  assert.equal(timeoutPhaseOf(0, false), null);
});

test('readContainerLogs repete apos falha transitoria e devolve o buffer', async () => {
  let calls = 0;
  const result = await readContainerLogs(
    async () => {
      calls += 1;
      if (calls < 3) throw new Error('409 dead or marked for removal');
      return Buffer.from('ok');
    },
    4,
    1,
  );
  assert.equal(result?.toString(), 'ok');
  assert.equal(calls, 3);
});

test('readContainerLogs desiste com null apos esgotar as tentativas', async () => {
  let calls = 0;
  const result = await readContainerLogs(
    async () => {
      calls += 1;
      throw new Error('409');
    },
    3,
    1,
  );
  assert.equal(result, null);
  assert.equal(calls, 3);
});

// RNF07-I01 — a linha de tempos que o script emite e removida de stderr antes do usuario ver.

test('extractStageTimings le as duas etapas e remove a linha de stderr', () => {
  const result = extractStageTimings(
    'aviso do compilador\n@@tplab-timing compile_ms=20 simulate_ms=1390\n',
  );
  assert.deepEqual(result, { stderr: 'aviso do compilador\n', compileMs: 20, simulateMs: 1390 });
});

test('extractStageTimings: etapa que nao terminou fica null (erro de compilacao)', () => {
  const result = extractStageTimings('/work/tb.v:1: syntax error\n@@tplab-timing compile_ms=10\n');
  assert.equal(result.compileMs, 10);
  assert.equal(result.simulateMs, null);
  assert.equal(result.stderr, '/work/tb.v:1: syntax error\n');
});

test('extractStageTimings: sem marca (container morto) devolve stderr intacto e nulls', () => {
  assert.deepEqual(extractStageTimings('Killed\n'), {
    stderr: 'Killed\n',
    compileMs: null,
    simulateMs: null,
  });
});

test('extractStageTimings vale a ultima marca e nunca deixa uma linha forjada aparecer', () => {
  const forged = '@@tplab-timing compile_ms=1 simulate_ms=1\n';
  const real = '@@tplab-timing compile_ms=30 simulate_ms=40\n';
  const result = extractStageTimings(`${forged}texto\n${real}`);
  assert.equal(result.compileMs, 30);
  assert.equal(result.simulateMs, 40);
  assert.equal(result.stderr, 'texto\n');
});

test('extractStageTimings so remove linhas inteiras no formato da marca', () => {
  const text = 'x @@tplab-timing compile_ms=5\n@@tplab-timing lixo\n';
  assert.equal(extractStageTimings(text).stderr, text);
});

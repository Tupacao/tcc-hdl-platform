import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demuxDockerLogs, truncateAtLineBoundary, truncateFromEnd } from './sandbox.js';

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

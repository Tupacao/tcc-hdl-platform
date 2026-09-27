import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demuxDockerLogs, truncateAtLineBoundary, truncateOutput } from './sandbox.js';

test('truncateAtLineBoundary devolve o conteudo intacto quando cabe no limite', () => {
  const content = 'linha 1\nlinha 2\n';
  assert.equal(truncateAtLineBoundary(content, content.length), content);
  assert.equal(truncateAtLineBoundary(content, content.length + 10), content);
});

test('truncateAtLineBoundary corta no ultimo \\n dentro do limite, nunca no meio de uma linha', () => {
  const content = 'linha 1\nlinha 2\nlinha 3\n';
  // Limite cai no meio de "linha 2" — deve voltar para o fim de "linha 1".
  const truncated = truncateAtLineBoundary(content, 12);
  assert.equal(truncated, 'linha 1\n');
  assert.ok(truncated.endsWith('\n'));
});

test('truncateAtLineBoundary sem newline antes do limite corta no byte exato', () => {
  const content = 'semquebrasdelinhaaqui';
  assert.equal(truncateAtLineBoundary(content, 5), content.slice(0, 5));
});

test('truncateOutput devolve o texto intacto quando cabe no limite', () => {
  const text = 'saida curta';
  assert.equal(truncateOutput(text, 100), text);
});

test('truncateOutput corta no limite e acrescenta aviso explicito', () => {
  const text = 'a'.repeat(100);
  const truncated = truncateOutput(text, 10);
  assert.ok(truncated.startsWith('a'.repeat(10)));
  assert.match(truncated, /saida truncada em \d+ KB/);
  assert.ok(truncated.length > 10);
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

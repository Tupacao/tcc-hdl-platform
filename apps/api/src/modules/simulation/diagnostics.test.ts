import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasErrors, parseIcarusDiagnostics } from './diagnostics.js';

test('extrai arquivo, linha e mensagem de um erro do iverilog', () => {
  const [diagnostic] = parseIcarusDiagnostics('design.v:12: error: Unknown module type: fulladder');

  assert.deepEqual(
    { ...diagnostic, raw: undefined },
    {
      severity: 'error',
      file: 'design.v',
      line: 12,
      column: null,
      message: 'Unknown module type: fulladder',
      raw: undefined,
    },
  );
});

test('reconhece warnings e coluna opcional', () => {
  const [diagnostic] = parseIcarusDiagnostics('tb.v:3:7: warning: Port 1 is not connected');

  assert.equal(diagnostic?.severity, 'warning');
  assert.equal(diagnostic?.line, 3);
  assert.equal(diagnostic?.column, 7);
});

test('trata erro de sintaxe sem prefixo de severidade', () => {
  const [diagnostic] = parseIcarusDiagnostics('design.v:5: syntax error');

  assert.equal(diagnostic?.severity, 'error');
  assert.equal(diagnostic?.message, 'syntax error');
});

test('preserva linhas sem localizacao', () => {
  const diagnostics = parseIcarusDiagnostics('2 error(s) during elaboration.');

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.line, null);
  assert.equal(diagnostics[0]?.file, '');
});

test('ignora linhas em branco e detecta presenca de erros', () => {
  const diagnostics = parseIcarusDiagnostics('\n\ndesign.v:1: warning: algo\n\n');

  assert.equal(diagnostics.length, 1);
  assert.equal(hasErrors(diagnostics), false);
});

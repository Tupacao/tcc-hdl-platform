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
      title: null,
      hint: null,
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

test('preserva linha sem localizacao reconhecida, sem descartar em silencio', () => {
  const diagnostics = parseIcarusDiagnostics('I give up.');

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.line, null);
  assert.equal(diagnostics[0]?.file, '');
  assert.equal(diagnostics[0]?.message, 'I give up.');
});

test('ignora linhas em branco e detecta presenca de erros', () => {
  const diagnostics = parseIcarusDiagnostics('\n\ndesign.v:1: warning: algo\n\n');

  assert.equal(diagnostics.length, 1);
  assert.equal(hasErrors(diagnostics), false);
});

// --- Fixtures reais, capturadas rodando iverilog -g2012 / vvp de verdade no
// tplab-sandbox:latest contra codigo quebrado de proposito (RF05-I01) ---------

test('normaliza o caminho absoluto do container para o nome submetido', () => {
  const [diagnostic] = parseIcarusDiagnostics('/work/full_adder.v:10: syntax error', [
    'full_adder.v',
    'full_adder_tb.v',
  ]);

  assert.equal(diagnostic?.file, 'full_adder.v');
});

test('mantem o caminho original quando nao bate com nenhum arquivo conhecido', () => {
  const [diagnostic] = parseIcarusDiagnostics('/work/outro.v:10: syntax error', [
    'full_adder.v',
    'full_adder_tb.v',
  ]);

  assert.equal(diagnostic?.file, '/work/outro.v');
});

test('modulo desconhecido: descarta o resumo de elaboracao e o bloco "*** modules were missing"', () => {
  const output = [
    '/work/tb.v:4: error: Unknown module type: fulladder',
    '2 error(s) during elaboration.',
    '*** These modules were missing:',
    '        fulladder referenced 1 times.',
    '***',
  ].join('\n');

  const diagnostics = parseIcarusDiagnostics(output, ['circuit.v', 'tb.v']);

  assert.equal(diagnostics.length, 1);
  assert.deepEqual(
    { ...diagnostics[0], raw: undefined },
    {
      severity: 'error',
      file: 'tb.v',
      line: 4,
      column: null,
      message: 'Unknown module type: fulladder',
      raw: undefined,
      title: null,
      hint: null,
    },
  );
});

test('"N error(s) during elaboration" sozinho nunca vira um diagnostico', () => {
  const diagnostics = parseIcarusDiagnostics('1 error(s) during elaboration.');

  assert.equal(diagnostics.length, 0);
});

test('aviso de largura de porta em duas linhas vira um unico diagnostico com a continuacao anexada', () => {
  const output = [
    '/work/tb.v:4: warning: Port 2 (y) of circuit expects 8 bits, got 4.',
    '/work/tb.v:4:        : Padding 4 high bits of the port.',
  ].join('\n');

  const diagnostics = parseIcarusDiagnostics(output, ['circuit.v', 'tb.v']);

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.severity, 'warning');
  assert.equal(diagnostics[0]?.file, 'tb.v');
  assert.equal(diagnostics[0]?.line, 4);
  assert.equal(
    diagnostics[0]?.message,
    'Port 2 (y) of circuit expects 8 bits, got 4. - Padding 4 high bits of the port.',
  );
});

test('$fatal do vvp (sem prefixo arquivo:linha) e sua continuacao indentada viram um diagnostico', () => {
  const output = [
    'FATAL: /work/tb.v:8: falha proposital para capturar o formato real',
    '       Time: 1  Scope: tb',
  ].join('\n');

  const diagnostics = parseIcarusDiagnostics(output, ['circuit.v', 'tb.v']);

  assert.equal(diagnostics.length, 1);
  assert.deepEqual(
    { ...diagnostics[0], raw: undefined },
    {
      severity: 'error',
      file: 'tb.v',
      line: 8,
      column: null,
      message: 'falha proposital para capturar o formato real - Time: 1  Scope: tb',
      raw: undefined,
      title: null,
      hint: null,
    },
  );
});

test('porta inexistente na instanciacao (elaboracao) mantem arquivo e linha', () => {
  const output = [
    "/work/tb.v:5: error: port ``z'' is not a port of dut.",
    '1 error(s) during elaboration.',
  ].join('\n');

  const diagnostics = parseIcarusDiagnostics(output, ['circuit.v', 'tb.v']);

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.file, 'tb.v');
  assert.equal(diagnostics[0]?.line, 5);
  assert.match(diagnostics[0]?.message ?? '', /is not a port of dut/);
});

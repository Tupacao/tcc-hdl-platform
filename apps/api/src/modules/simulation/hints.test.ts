import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic } from '@tplab/shared';
import { attachHints, hintFor } from './hints.js';

test('modulo desconhecido recebe explicacao sobre nome divergente', () => {
  const hint = hintFor('Unknown module type: fulladder');
  assert.match(hint ?? '', /nome usado na instanciacao/);
});

test('"I give up." recebe explicacao sobre corrigir o primeiro erro', () => {
  const hint = hintFor('I give up.');
  assert.match(hint ?? '', /primeiro erro da lista/);
});

test('porta inexistente na instanciacao recebe explicacao sobre nome divergente', () => {
  const hint = hintFor("port ``z'' is not a port of dut.");
  assert.match(hint ?? '', /nao existe no modulo/);
});

test('largura de vetor incompativel recebe explicacao sobre "[N:0]"', () => {
  const hint = hintFor('Port 2 (y) of circuit expects 8 bits, got 4.');
  assert.match(hint ?? '', /\[N:0\]/);
});

// `message` chega sem o prefixo "sorry:" (o parser ja extrai isso para
// `severity`) - fixture real: `let` (construcao SystemVerilog) contra o
// tplab-sandbox:latest produziu "sorry: let declarations (my_and) are not
// currently supported."
test('construcao nao suportada pelo Icarus recebe explicacao sobre limitacao da ferramenta', () => {
  const hint = hintFor('let declarations (my_and) are not currently supported.');
  assert.match(hint ?? '', /limitacao da ferramenta/);
});

test('syntax error recebe explicacao sobre ponto e virgula/end/endmodule', () => {
  const hint = hintFor('syntax error');
  assert.match(hint ?? '', /";", um "end" ou um "endmodule"/);
});

test('mensagem sem regra correspondente fica com hint nulo', () => {
  const hint = hintFor('this is not a recognized icarus message at all');
  assert.equal(hint, null);
});

test('attachHints preenche hint em cada diagnostico sem alterar os demais campos', () => {
  const diagnostics: Diagnostic[] = [
    {
      severity: 'error',
      file: 'design.v',
      line: 12,
      column: null,
      message: 'syntax error',
      raw: 'design.v:12: syntax error',
      hint: null,
    },
    {
      severity: 'warning',
      file: 'design.v',
      line: 3,
      column: null,
      message: 'nada reconhecido aqui',
      raw: 'design.v:3: warning: nada reconhecido aqui',
      hint: null,
    },
  ];

  const enriched = attachHints(diagnostics);

  assert.match(enriched[0]?.hint ?? '', /endmodule/);
  assert.equal(enriched[1]?.hint, null);
  assert.equal(enriched[0]?.message, 'syntax error');
  assert.equal(enriched[0]?.raw, 'design.v:12: syntax error');
});

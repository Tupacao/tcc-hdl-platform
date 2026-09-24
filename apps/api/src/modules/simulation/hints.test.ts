import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic } from '@tplab/shared';
import { attachHints, explanationFor } from './hints.js';

test('módulo desconhecido traz o nome no título e explica o nome divergente', () => {
  const explanation = explanationFor('Unknown module type: fulladder');
  assert.equal(explanation?.title, 'O módulo fulladder não foi encontrado');
  assert.match(explanation?.hint ?? '', /nome usado na instanciação/);
});

test('"I give up." explica que se deve corrigir o primeiro erro', () => {
  const explanation = explanationFor('I give up.');
  assert.equal(explanation?.title, 'O compilador parou por causa de erros anteriores');
  assert.match(explanation?.hint ?? '', /primeiro erro da lista/);
});

test('porta inexistente na instanciação explica o nome divergente', () => {
  const explanation = explanationFor("port ``z'' is not a port of dut.");
  assert.equal(explanation?.title, 'Porta inexistente no módulo');
  assert.match(explanation?.hint ?? '', /não existe no módulo/);
});

test('largura de vetor incompatível explica o "[N:0]"', () => {
  const explanation = explanationFor('Port 2 (y) of circuit expects 8 bits, got 4.');
  assert.equal(explanation?.title, 'Largura de sinal incompatível');
  assert.match(explanation?.hint ?? '', /\[N:0\]/);
});

// `message` chega sem o prefixo "sorry:" (o parser já extrai isso para
// `severity`) — fixture real: `let` (construção SystemVerilog) contra o
// tplab-sandbox:latest produziu "sorry: let declarations (my_and) are not
// currently supported."
test('construção não suportada pelo Icarus explica a limitação da ferramenta', () => {
  const explanation = explanationFor('let declarations (my_and) are not currently supported.');
  assert.equal(explanation?.title, 'Construção não suportada pelo Icarus Verilog');
  assert.match(explanation?.hint ?? '', /limitação da ferramenta/);
});

test('syntax error explica ponto e vírgula/end/endmodule', () => {
  const explanation = explanationFor('syntax error');
  assert.equal(explanation?.title, 'Erro de sintaxe');
  assert.match(explanation?.hint ?? '', /";", um "end" ou um "endmodule"/);
});

test('mensagem sem regra correspondente não tem explicação', () => {
  assert.equal(explanationFor('this is not a recognized icarus message at all'), null);
});

test('attachHints preenche título e dica sem alterar os demais campos', () => {
  const diagnostics: Diagnostic[] = [
    {
      severity: 'error',
      file: 'design.v',
      line: 12,
      column: null,
      message: 'syntax error',
      raw: 'design.v:12: syntax error',
      title: null,
      hint: null,
    },
    {
      severity: 'warning',
      file: 'design.v',
      line: 3,
      column: null,
      message: 'nada reconhecido aqui',
      raw: 'design.v:3: warning: nada reconhecido aqui',
      title: null,
      hint: null,
    },
  ];

  const enriched = attachHints(diagnostics);

  assert.equal(enriched[0]?.title, 'Erro de sintaxe');
  assert.match(enriched[0]?.hint ?? '', /endmodule/);
  assert.equal(enriched[1]?.title, null);
  assert.equal(enriched[1]?.hint, null);
  assert.equal(enriched[0]?.message, 'syntax error');
  assert.equal(enriched[0]?.raw, 'design.v:12: syntax error');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tokenizeVerilog } from '../../utils/verilog-highlight';

test('tokenizeVerilog reconhece module, wire e endmodule', () => {
  const tokens = tokenizeVerilog('module m; wire a; endmodule');
  const types = tokens.filter((t) => t.text.trim()).map((t) => `${t.text}:${t.type}`);
  assert.deepEqual(types, [
    'module:keyword',
    'm:plain',
    ';:operator',
    'wire:type',
    'a:plain',
    ';:operator',
    'endmodule:keyword',
  ]);
});

test('tokenizeVerilog reconhece numero com base', () => {
  const tokens = tokenizeVerilog("4'b1010");
  assert.deepEqual(tokens, [{ text: "4'b1010", type: 'number' }]);
});

test('tokenizeVerilog reconhece numero decimal simples', () => {
  const tokens = tokenizeVerilog('i < 8');
  assert.deepEqual(tokens, [
    { text: 'i', type: 'plain' },
    { text: ' ', type: 'plain' },
    { text: '<', type: 'operator' },
    { text: ' ', type: 'plain' },
    { text: '8', type: 'number' },
  ]);
});

test('tokenizeVerilog reconhece tarefa de sistema e diretiva', () => {
  const tokens = tokenizeVerilog('$display("x"); `timescale');
  const types = tokens.map((t) => t.type);
  assert.ok(types.includes('directive'));
  assert.ok(types.includes('string'));
});

test('tokenizeVerilog reconhece comentario de linha e de bloco', () => {
  const linha = tokenizeVerilog('a; // comentario');
  assert.equal(linha.at(-1)?.type, 'comment');

  const bloco = tokenizeVerilog('/* bloco\nde comentario */ a;');
  assert.equal(bloco[0]?.type, 'comment');
});

test('tokenizeVerilog preserva o texto original ao juntar os tokens', () => {
  const code = "module full_adder (\n    input wire a\n);\nassign sum = a ^ b; // xor\nendmodule";
  const tokens = tokenizeVerilog(code);
  assert.equal(
    tokens.map((t) => t.text).join(''),
    code,
  );
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toVerilogLiteral } from '../../utils/verilog-literal';

test('sinal escalar (1 bit) mostra o valor cru, sem prefixo', () => {
  assert.equal(toVerilogLiteral('0', 1), '0');
  assert.equal(toVerilogLiteral('x', 1), 'x');
});

test('barramento usa o formato de literal Verilog dimensionado (frame 8.2 do Figma)', () => {
  assert.equal(toVerilogLiteral('1111', 4), "4'b1111");
  assert.equal(
    toVerilogLiteral('00000000000000000000000000000100', 32),
    "32'b00000000000000000000000000000100",
  );
});

test('barramento parcialmente indefinido preserva os x no mesmo literal', () => {
  assert.equal(toVerilogLiteral('10xx', 4), "4'b10xx");
});

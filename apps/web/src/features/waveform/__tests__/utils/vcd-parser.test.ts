import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseVcd, valueAt } from '../../utils/vcd-parser';

/**
 * Aproxima o VCD que o iverilog gera para o exemplo full_adder (apps/web/src/lib/samples.ts):
 * escopo `full_adder_tb` com os regs/wires do testbench, escopo aninhado `dut` reaproveitando os
 * mesmos identificadores (os nets estao eletricamente ligados pela instancia), um vetor (`i`) e
 * um "dumpvars" inicial em x seguido, no mesmo instante, do valor real (RF06-I01 exige dedup).
 */
const FULL_ADDER_VCD = `$timescale 1ns $end
$scope module full_adder_tb $end
$var reg 1 ! a $end
$var reg 1 " b $end
$var reg 1 # cin $end
$var wire 1 $ sum $end
$var wire 1 % cout $end
$var integer 32 & i $end
$scope module dut $end
$var wire 1 ! a $end
$var wire 1 " b $end
$var wire 1 # cin $end
$var wire 1 $ sum $end
$var wire 1 % cout $end
$upscope $end
$upscope $end
$enddefinitions $end
#0
$dumpvars
x!
x"
x#
x$
x%
b0 &
$end
0!
0"
0#
0$
0%
#10
1#
1$
b1 &
#20
1"
0#
b10 &
#30
1#
0$
1%
b11 &
`;

test('produz o conjunto correto de sinais, com largura e caminho de escopo', () => {
  const waveform = parseVcd(FULL_ADDER_VCD);

  assert.equal(waveform.truncated, false);
  assert.equal(waveform.timescale, 1);
  assert.equal(waveform.timeUnit, 'ns');
  assert.equal(waveform.signals.length, 11);

  const topSum = waveform.signals.find((s) => s.scope === 'full_adder_tb' && s.name === 'sum');
  assert.ok(topSum);
  assert.equal(topSum.width, 1);
  assert.equal(topSum.id, '$');

  const dutSum = waveform.signals.find((s) => s.scope === 'full_adder_tb.dut' && s.name === 'sum');
  assert.ok(dutSum);
  assert.equal(dutSum.id, '$');

  const counter = waveform.signals.find((s) => s.name === 'i');
  assert.ok(counter);
  assert.equal(counter.width, 32);
});

test('um mesmo id reaproveitado por dois sinais aponta para a mesma serie de transicoes', () => {
  const waveform = parseVcd(FULL_ADDER_VCD);

  const series = waveform.transitions.get('$');
  assert.ok(series);
  // a e dut.sum sao entradas de sinal distintas, mas o id "$" so tem UMA serie de transicoes.
  assert.equal(waveform.transitions.size, 6);
  assert.equal(series[0]?.value, '0');
});

test('transicoes ficam ordenadas por tempo e sem duplicidade (x -> 0 no mesmo instante colapsa)', () => {
  const waveform = parseVcd(FULL_ADDER_VCD);

  const cin = waveform.transitions.get('#');
  assert.ok(cin);
  assert.deepEqual(
    cin.map((t) => t.time),
    [0, 10, 20, 30],
  );
  assert.deepEqual(
    cin.map((t) => t.value),
    ['0', '1', '0', '1'],
  );

  const a = waveform.transitions.get('!');
  assert.ok(a);
  assert.equal(a.length, 1);
  assert.equal(a[0]?.value, '0');
});

test('valueAt devolve o valor vigente em qualquer instante, inclusive antes da primeira transicao', () => {
  const waveform = parseVcd(FULL_ADDER_VCD);

  assert.equal(valueAt(waveform, '#', -5), 'x');
  assert.equal(valueAt(waveform, '#', 0), '0');
  assert.equal(valueAt(waveform, '#', 15), '1');
  assert.equal(valueAt(waveform, '#', 20), '0');
  assert.equal(valueAt(waveform, '#', 1000), '1');
});

test('vetores tem os zeros a esquerda restaurados conforme a largura declarada', () => {
  const waveform = parseVcd(FULL_ADDER_VCD);

  assert.equal(valueAt(waveform, '&', 0), '0'.repeat(32));
  assert.equal(valueAt(waveform, '&', 10), `${'0'.repeat(31)}1`);
  assert.equal(valueAt(waveform, '&', 20), `${'0'.repeat(30)}10`);
  assert.equal(valueAt(waveform, '&', 30), `${'0'.repeat(30)}11`);
});

test('vetor com bit x mais significativo estende o preenchimento com x, nao com 0', () => {
  const vcd = `$var wire 8 ! nib $end
$enddefinitions $end
#0
bx101 !
`;

  const waveform = parseVcd(vcd);

  assert.equal(waveform.truncated, false);
  assert.equal(valueAt(waveform, '!', 0), 'xxxxx101');
});

test('arquivo sem $timescale nao lanca excecao e usa um padrao', () => {
  const vcd = `$var wire 1 ! clk $end
$enddefinitions $end
#0
0!
#5
1!
`;

  const waveform = parseVcd(vcd);

  assert.equal(waveform.truncated, false);
  assert.equal(waveform.timeUnit, '');
  assert.equal(valueAt(waveform, '!', 5), '1');
});

test('$scope aninhado sem $upscope correspondente ainda produz o sinal com o caminho parcial', () => {
  const vcd = `$scope module tb $end
$scope module dut $end
$var wire 1 ! q $end
$enddefinitions $end
#0
0!
`;

  const waveform = parseVcd(vcd);

  assert.equal(waveform.signals[0]?.scope, 'tb.dut');
});

test('arquivo truncado no meio de um valor para no ultimo registro completo e sinaliza truncated', () => {
  const vcd = `$var wire 8 ! data $end
$enddefinitions $end
#0
b00000000 !
#10
b101`;

  const waveform = parseVcd(vcd);

  assert.equal(waveform.truncated, true);
  assert.equal(valueAt(waveform, '!', 10), '0'.repeat(8));
});

test('o parser nao lanca excecao para nenhuma das fixtures, mesmo com lixo no corpo', () => {
  const vcd = `$var wire 1 ! a $end
$enddefinitions $end
#0
0!
isto nao e uma linha valida de vcd
1!
`;

  assert.doesNotThrow(() => {
    const waveform = parseVcd(vcd);
    assert.equal(waveform.truncated, true);
  });
});

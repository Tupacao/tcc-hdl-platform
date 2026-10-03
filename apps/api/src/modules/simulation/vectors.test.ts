import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeToolchainVectors } from './vectors.js';

const file = (content: string, name = 'tb.v') => ({ name, content });

test('caminho relativo e uso legitimo nao geram aviso', () => {
  const diagnostics = analyzeToolchainVectors([
    file(`module tb;
  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    $readmemh("dados.hex", mem);
    fd = $fopen("saida.txt", "w");
  end
endmodule
\`include "outro.v"`),
  ]);
  assert.deepEqual(diagnostics, []);
});

test('`include com caminho absoluto avisa, com a linha certa', () => {
  const [diagnostic] = analyzeToolchainVectors([
    file('module tb;\nendmodule\n`include "/etc/passwd"'),
  ]);
  assert.ok(diagnostic);
  assert.equal(diagnostic.severity, 'warning');
  assert.equal(diagnostic.file, 'tb.v');
  assert.equal(diagnostic.line, 3);
  assert.match(diagnostic.message, /\/etc\/passwd/);
});

test('$readmemh/$readmemb, $fopen e $dumpfile fora do projeto avisam', () => {
  const diagnostics = analyzeToolchainVectors([
    file(`initial begin
  $readmemh("/etc/passwd", m);
  $readmemb("../dados.bin", m);
  fd = $fopen("/etc/pwn", "w");
  $dumpfile("/tmp/x.vcd");
end`),
  ]);
  assert.equal(diagnostics.length, 4);
  assert.deepEqual(
    diagnostics.map((d) => d.line),
    [2, 3, 4, 5],
  );
});

test('caminho com .. e unidade de disco do Windows tambem sao detectados', () => {
  assert.equal(analyzeToolchainVectors([file('initial $dumpfile("../x.vcd");')]).length, 1);
  assert.equal(analyzeToolchainVectors([file('initial $dumpfile("C:\\\\x.vcd");')]).length, 1);
  // ".." dentro de um nome nao e travessia.
  assert.equal(analyzeToolchainVectors([file('initial $dumpfile("a..b.vcd");')]).length, 0);
});

test('$system avisa que nao existe na plataforma', () => {
  const [diagnostic] = analyzeToolchainVectors([file('initial $system("id");')]);
  assert.match(diagnostic?.message ?? '', /não existe nesta plataforma/);
});

test('comentarios nao geram aviso e nao deslocam a numeracao das linhas', () => {
  const diagnostics = analyzeToolchainVectors([
    file(`// $dumpfile("/x.vcd");
/* $system("id");
   $fopen("/y", "w"); */
initial $dumpfile("/z.vcd");`),
  ]);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.line, 4);
});

test('analisa design e testbench, citando o arquivo de cada aviso', () => {
  const diagnostics = analyzeToolchainVectors([
    file('module dut; initial $fopen("/a", "w"); endmodule', 'dut.v'),
    file('module tb; initial $dumpfile("/b.vcd"); endmodule', 'tb.v'),
  ]);
  assert.deepEqual(
    diagnostics.map((d) => d.file),
    ['dut.v', 'tb.v'],
  );
});

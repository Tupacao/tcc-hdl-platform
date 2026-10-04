import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HdlFile } from '@tplab/shared';
import {
  analyzePostExecution,
  analyzeTestbenchContract,
} from '../../application/simulation/service/testbench.js';

function file(name: string, content: string): HdlFile {
  return { name, content };
}

const VALID_DESIGN = file('d.v', 'module counter(input clk, output reg [3:0] q); endmodule');

test('testbench que instancia o topModule nao gera aviso de instanciacao', () => {
  const testbench = file('tb.v', 'counter dut (.clk(clk), .q(q));');
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  assert.ok(!result.diagnostics.some((d) => d.message.includes('não parece instanciar')));
});

test('testbench que nao instancia o topModule gera aviso', () => {
  const testbench = file('tb.v', 'wire clk;');
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  const found = result.diagnostics.find((d) => d.message.includes('não parece instanciar'));
  assert.ok(found);
  assert.equal(found.severity, 'warning');
  assert.equal(found.file, 'tb.v');
});

test('aceita instanciacao parametrizada (#(.WIDTH(8)))', () => {
  const testbench = file('tb.v', 'counter #(.WIDTH(8)) dut (.clk(clk), .q(q));');
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  assert.ok(!result.diagnostics.some((d) => d.message.includes('não parece instanciar')));
});

test('aceita instanciacao quebrada em varias linhas', () => {
  const testbench = file(
    'tb.v',
    `counter
       dut (.clk(clk), .q(q));`,
  );
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  assert.ok(!result.diagnostics.some((d) => d.message.includes('não parece instanciar')));
});

test('mencao dentro de comentario nao conta como instanciacao', () => {
  const testbench = file(
    'tb.v',
    `// counter dut (.clk(clk), .q(q));
     /* counter outro (.clk(clk), .q(q)); */
     wire clk;`,
  );
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  assert.ok(result.diagnostics.some((d) => d.message.includes('não parece instanciar')));
});

test('design que nao declara o topModule gera aviso', () => {
  const design = file('d.v', 'module outro_nome(); endmodule');
  const testbench = file('tb.v', 'counter dut (.clk(clk), .q(q));');
  const result = analyzeTestbenchContract(design, testbench, 'counter');

  const found = result.diagnostics.find((d) => d.message.includes('não declara'));
  assert.ok(found);
  assert.equal(found.file, 'd.v');
});

test('testbench sem $dumpfile/$dumpvars gera aviso com exemplo copiavel', () => {
  const testbench = file('tb.v', 'counter dut (.clk(clk), .q(q));');
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  const found = result.diagnostics.find((d) => d.message.includes('$dumpfile'));
  assert.ok(found);
  assert.match(found.message, /\$dumpvars\(0, counter\)/);
  assert.equal(result.missingDumpDirectives, true);
});

test('testbench com $dumpfile e $dumpvars nao gera aviso de gravacao', () => {
  const testbench = file(
    'tb.v',
    'counter dut (.clk(clk), .q(q)); initial begin $dumpfile("x.vcd"); $dumpvars(0, tb); end',
  );
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  assert.equal(result.missingDumpDirectives, false);
  assert.ok(!result.diagnostics.some((d) => d.message.includes('$dumpfile')));
});

test('nenhum aviso e error - sempre warning, a submissao nunca e bloqueada', () => {
  const testbench = file('tb.v', 'wire clk;');
  const result = analyzeTestbenchContract(VALID_DESIGN, testbench, 'counter');

  assert.ok(result.diagnostics.length > 0);
  assert.ok(result.diagnostics.every((d) => d.severity === 'warning'));
});

// Espelha apps/web/src/lib/samples.ts (RF20) — copiado, nao importado: apps/api
// e apps/web sao pacotes separados no monorepo, sem dependencia um do outro.
// Se o exemplo mudar em samples.ts, este teste precisa acompanhar.
test('o exemplo de samples.ts (full_adder) nao gera nenhum aviso', () => {
  const design = file(
    'full_adder.v',
    `module full_adder (
    input  wire a,
    input  wire b,
    input  wire cin,
    output wire sum,
    output wire cout
);
    assign sum  = a ^ b ^ cin;
    assign cout = (a & b) | (cin & (a ^ b));
endmodule`,
  );
  const testbench = file(
    'full_adder_tb.v',
    `module full_adder_tb;
    reg  a, b, cin;
    wire sum, cout;
    integer i;

    full_adder dut (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));

    initial begin
        $dumpfile("wave.vcd");
        $dumpvars(0, full_adder_tb);

        for (i = 0; i < 8; i = i + 1) begin
            {a, b, cin} = i[2:0];
            #10;
            $display("a=%b b=%b cin=%b -> sum=%b cout=%b", a, b, cin, sum, cout);
        end

        $finish;
    end
endmodule`,
  );

  const result = analyzeTestbenchContract(design, testbench, 'full_adder');

  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.missingDumpDirectives, false);
});

test('analyzePostExecution: sucesso sem stdout nem vcd sugere que o testbench nao instanciou o design', () => {
  const [diagnostic] = analyzePostExecution({
    testbenchName: 'tb.v',
    topModule: 'counter',
    failure: null,
    stdout: '',
    vcd: null,
    alreadyWarnedMissingDump: false,
  });

  assert.ok(diagnostic);
  assert.match(diagnostic.message, /provavelmente não instancia/);
});

test('analyzePostExecution: sucesso com stdout mas sem vcd pede para conferir dumpfile/dumpvars', () => {
  const [diagnostic] = analyzePostExecution({
    testbenchName: 'tb.v',
    topModule: 'counter',
    failure: null,
    stdout: 'ola\n',
    vcd: null,
    alreadyWarnedMissingDump: false,
  });

  assert.ok(diagnostic);
  assert.match(diagnostic.message, /dumpfile\/\$dumpvars/);
});

test('analyzePostExecution: nao duplica o aviso ja emitido pela checagem estatica', () => {
  const diagnostics = analyzePostExecution({
    testbenchName: 'tb.v',
    topModule: 'counter',
    failure: null,
    stdout: 'ola\n',
    vcd: null,
    alreadyWarnedMissingDump: true,
  });

  assert.deepEqual(diagnostics, []);
});

test('analyzePostExecution: nao avisa quando ha falha, ou quando o vcd existe', () => {
  assert.deepEqual(
    analyzePostExecution({
      testbenchName: 'tb.v',
      topModule: 'counter',
      failure: 'compile_error',
      stdout: '',
      vcd: null,
      alreadyWarnedMissingDump: false,
    }),
    [],
  );

  assert.deepEqual(
    analyzePostExecution({
      testbenchName: 'tb.v',
      topModule: 'counter',
      failure: null,
      stdout: '',
      vcd: '$dumpfile...',
      alreadyWarnedMissingDump: false,
    }),
    [],
  );
});

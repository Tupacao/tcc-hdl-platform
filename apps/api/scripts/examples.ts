/**
 * Exemplos de referencia (o catalogo de RF20) + um caso pesado deliberado e uma RAM grande legitima —
 * compartilhados pelos scripts de medicao (`measure-sandbox.ts`, `measure-e2e.ts`).
 */
import type { HdlSources } from '@tplab/shared';

export interface Case {
  files: Record<string, string>;
}

const DUMP = '$dumpfile("wave.vcd"); $dumpvars(0, tb);';

function ramCase(words: number): Case {
  const bits = Math.log2(words);
  return {
    files: {
      'ram.v': `module ram(input clk, we, input [${bits - 1}:0] addr, input [31:0] din, output reg [31:0] dout);
  reg [31:0] mem [0:${words - 1}];
  always @(posedge clk) begin if (we) mem[addr] <= din; dout <= mem[addr]; end
endmodule
`,
      'tb.v': `\`timescale 1ns/1ps
module tb;
  reg clk = 0, we = 0; reg [${bits - 1}:0] addr = 0; reg [31:0] din = 0; wire [31:0] dout; integer i;
  ram dut(.clk(clk), .we(we), .addr(addr), .din(din), .dout(dout));
  always #5 clk = ~clk;
  initial begin
    for (i = 0; i < ${words}; i = i + 1) dut.mem[i] = i;
    we = 1; for (i = 0; i < 64; i = i + 1) begin addr = i; din = i * 3; #10; end
    we = 0; addr = 5; #10; $display("dout=%0d", dout);
    $finish;
  end
endmodule
`,
    },
  };
}

function counterCase(bits: number, cycles: number): Case {
  return {
    files: {
      'contador.v': `module contador(input clk, rst, output reg [${bits - 1}:0] q);
  always @(posedge clk) if (rst) q <= 0; else q <= q + 1;
endmodule
`,
      'tb.v': `\`timescale 1ns/1ps
module tb;
  reg clk = 0, rst = 1; wire [${bits - 1}:0] q;
  contador dut(.clk(clk), .rst(rst), .q(q));
  always #5 clk = ~clk;
  initial begin
    ${DUMP}
    #12 rst = 0;
    #${cycles * 10} $display("q=%d", q);
    $finish;
  end
endmodule
`,
    },
  };
}

/** Exemplos de referencia (o catalogo de RF20) + um caso pesado deliberado e uma RAM grande legitima. */
export const CASES: Record<string, Case> = {
  somador: {
    files: {
      'somador.v': `module somador(input a, b, cin, output sum, cout);
  assign sum = a ^ b ^ cin;
  assign cout = (a & b) | (cin & (a ^ b));
endmodule
`,
      'tb.v': `\`timescale 1ns/1ps
module tb;
  reg a, b, cin; wire sum, cout; integer i;
  somador dut(.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));
  initial begin
    ${DUMP}
    for (i = 0; i < 8; i = i + 1) begin {a, b, cin} = i[2:0]; #10; $display("sum=%b cout=%b", sum, cout); end
    $finish;
  end
endmodule
`,
    },
  },
  mux4: {
    files: {
      'mux4.v': `module mux4(input [3:0] d, input [1:0] s, output reg y);
  always @* case (s) 2'd0: y = d[0]; 2'd1: y = d[1]; 2'd2: y = d[2]; default: y = d[3]; endcase
endmodule
`,
      'tb.v': `\`timescale 1ns/1ps
module tb;
  reg [3:0] d; reg [1:0] s; wire y; integer i;
  mux4 dut(.d(d), .s(s), .y(y));
  initial begin
    ${DUMP}
    d = 4'b1010;
    for (i = 0; i < 4; i = i + 1) begin s = i[1:0]; #10; $display("s=%d y=%b", s, y); end
    $finish;
  end
endmodule
`,
    },
  },
  contador4: counterCase(4, 30),
  ula8: {
    files: {
      'ula.v': `module ula(input [7:0] a, b, input [2:0] op, output reg [7:0] y, output zero);
  always @* case (op)
    3'd0: y = a + b; 3'd1: y = a - b; 3'd2: y = a & b; 3'd3: y = a | b;
    3'd4: y = a ^ b; 3'd5: y = ~a; 3'd6: y = a << 1; default: y = a >> 1;
  endcase
  assign zero = (y == 8'd0);
endmodule
`,
      'tb.v': `\`timescale 1ns/1ps
module tb;
  reg [7:0] a, b; reg [2:0] op; wire [7:0] y; wire zero; integer i;
  ula dut(.a(a), .b(b), .op(op), .y(y), .zero(zero));
  initial begin
    ${DUMP}
    a = 8'hA5; b = 8'h3C;
    for (i = 0; i < 8; i = i + 1) begin op = i[2:0]; #10; $display("op=%d y=%h", op, y); end
    $finish;
  end
endmodule
`,
    },
  },
  shift8: {
    files: {
      'shift.v': `module shift(input clk, rst, din, output reg [7:0] q);
  always @(posedge clk) if (rst) q <= 0; else q <= {q[6:0], din};
endmodule
`,
      'tb.v': `\`timescale 1ns/1ps
module tb;
  reg clk = 0, rst = 1, din = 0; wire [7:0] q; integer i;
  shift dut(.clk(clk), .rst(rst), .din(din), .q(q));
  always #5 clk = ~clk;
  initial begin
    ${DUMP}
    #12 rst = 0;
    for (i = 0; i < 64; i = i + 1) begin din = (i % 3 == 0); #10; end
    $display("q=%b", q);
    $finish;
  end
endmodule
`,
    },
  },
  ram1m: ramCase(1 << 20),
  // Caso pesado deliberado: contador de 16 bits, 200 mil ciclos, $dumpvars completo.
  pesado16: counterCase(16, 200_000),
};

/** `design` + `testbench` no formato do contrato da API (o testbench e sempre `tb.v`, topo `tb`). */
export function toSources(testCase: Case): HdlSources {
  const design = Object.entries(testCase.files).find(([name]) => name !== 'tb.v');
  if (!design) throw new Error('caso sem arquivo de design');
  return {
    language: 'verilog',
    topModule: 'tb',
    design: { name: design[0], content: design[1] },
    testbench: { name: 'tb.v', content: testCase.files['tb.v'] ?? '' },
  };
}

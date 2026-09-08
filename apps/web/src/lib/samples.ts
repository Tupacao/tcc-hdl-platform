import type { HdlSources } from '@tplab/shared';

/** Projeto de exemplo carregado no primeiro acesso (RF20). */
export const SAMPLE_SOURCES: HdlSources = {
  language: 'verilog',
  topModule: 'full_adder',
  design: {
    name: 'full_adder.v',
    content: `// Somador completo de 1 bit
module full_adder (
    input  wire a,
    input  wire b,
    input  wire cin,
    output wire sum,
    output wire cout
);
    assign sum  = a ^ b ^ cin;
    assign cout = (a & b) | (cin & (a ^ b));
endmodule
`,
  },
  testbench: {
    name: 'full_adder_tb.v',
    content: `\`timescale 1ns / 1ps

module full_adder_tb;
    reg  a, b, cin;
    wire sum, cout;
    integer i;

    full_adder dut (.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));

    initial begin
        // Gera o arquivo de formas de onda lido pelo visualizador
        $dumpfile("wave.vcd");
        $dumpvars(0, full_adder_tb);

        for (i = 0; i < 8; i = i + 1) begin
            {a, b, cin} = i[2:0];
            #10;
            $display("a=%b b=%b cin=%b -> sum=%b cout=%b", a, b, cin, sum, cout);
        end

        $finish;
    end
endmodule
`,
  },
};

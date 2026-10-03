/**
 * Medicao dos limites do sandbox (RNF05-I02) — repetivel na VM alvo.
 *
 *   pnpm sandbox:build
 *   pnpm --filter @tplab/api measure:sandbox            # 20 amostras de cada exemplo
 *   pnpm --filter @tplab/api measure:sandbox 5 pesado16 # N amostras de casos especificos
 *   pnpm --filter @tplab/api measure:sandbox cap        # compilacao no teto de MAX_SOURCE_BYTES
 *   pnpm --filter @tplab/api measure:sandbox cpu        # efeito de SANDBOX_CPUS
 *
 * Roda cada caso no container com as MESMAS opcoes de `runInSandbox`
 * (`buildSandboxContainerOptions`), trocando so o entrypoint por um shell que replica o
 * `run-simulation.sh` separando compilacao de simulacao e le o pico de memoria do cgroup v2
 * (`memory.peak`). A primeira amostra de cada caso e descartada (cache do Docker). Resultados e
 * o raciocinio de cada limite: README.md, secao "Dimensionamento dos limites".
 */
import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Docker from 'dockerode';
import { MAX_SOURCE_BYTES } from '@tplab/shared';
import {
  buildSandboxContainerOptions,
  defaultSandboxLimits,
} from '../src/modules/simulation/sandbox.js';

const docker = new Docker();

interface Case {
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
const CASES: Record<string, Case> = {
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

/** Replica `run-simulation.sh` separando as etapas e lendo o pico de memoria do cgroup v2. */
const WRAPPER = [
  'now() { cut -d" " -f1 /proc/uptime; }',
  't0=$(now)',
  'iverilog -g2012 -o /tmp/s.vvp /work/*.v || exit 2',
  't1=$(now)',
  'vvp /tmp/s.vvp > /tmp/out.txt 2>&1; st=$?',
  't2=$(now)',
  'echo "T $t0 $t1 $t2 peak=$(cat /sys/fs/cgroup/memory.peak) st=$st" >&2',
  'exit $st',
].join('\n');

interface Sample {
  createMs: number;
  compileMs: number;
  simMs: number;
  wallMs: number;
  peakMb: number;
  vcdBytes: number;
  status: number;
}

async function runCase(testCase: Case, cpus?: number): Promise<Sample> {
  const workdir = await mkdtemp(join(tmpdir(), 'hdl-sim-measure-'));
  try {
    for (const [name, content] of Object.entries(testCase.files)) {
      await writeFile(join(workdir, name), content);
    }
    const limits = { ...defaultSandboxLimits(), ...(cpus ? { cpus } : {}) };
    const options = buildSandboxContainerOptions(workdir, limits);
    options.Entrypoint = ['/bin/sh', '-c'];
    options.Cmd = [WRAPPER];

    const createStarted = Date.now();
    const container = await docker.createContainer(options);
    const createMs = Date.now() - createStarted;
    try {
      const started = Date.now();
      await container.start();
      const { StatusCode } = (await container.wait()) as { StatusCode: number };
      const wallMs = Date.now() - started;

      let logs = '';
      for (let attempt = 0; attempt < 5 && !logs; attempt++) {
        logs = await container
          .logs({ stdout: true, stderr: true })
          .then((buffer) => (buffer as unknown as Buffer).toString('utf8'))
          .catch(() => '');
        if (!logs) await new Promise((resolve) => setTimeout(resolve, 300));
      }
      const marks = /T ([\d.]+) ([\d.]+) ([\d.]+) peak=(\d+) st=(\d+)/.exec(logs);
      if (!marks) throw new Error(`sem marcas de tempo: ${logs.slice(0, 200)}`);

      let vcdBytes = 0;
      for (const file of await readdir(workdir)) {
        if (file.endsWith('.vcd')) vcdBytes = (await stat(join(workdir, file))).size;
      }
      return {
        createMs,
        compileMs: Math.round((Number(marks[2]) - Number(marks[1])) * 1000),
        simMs: Math.round((Number(marks[3]) - Number(marks[2])) * 1000),
        wallMs,
        peakMb: Number(marks[4]) / (1024 * 1024),
        vcdBytes,
        status: StatusCode,
      };
    } finally {
      await container.remove({ force: true }).catch(() => undefined);
    }
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0;
}

function summarize(values: number[]): string {
  return `mediana=${percentile(values, 50).toFixed(0)} p95=${percentile(values, 95).toFixed(0)} max=${Math.max(...values).toFixed(0)}`;
}

async function measureExamples(samples: number, names: string[]): Promise<void> {
  for (const name of names) {
    const testCase = CASES[name];
    if (!testCase)
      throw new Error(`caso desconhecido: ${name} (opcoes: ${Object.keys(CASES).join(', ')})`);
    const runs: Sample[] = [];
    for (let i = 0; i < samples + 1; i++) {
      const sample = await runCase(testCase);
      if (i > 0) runs.push(sample);
    }
    console.log(
      `\n## ${name} (n=${runs.length}, 1a amostra descartada) vcd=${runs[0]?.vcdBytes} B`,
    );
    for (const key of ['createMs', 'compileMs', 'simMs', 'wallMs', 'peakMb'] as const) {
      console.log(`  ${key.padEnd(10)} ${summarize(runs.map((run) => run[key]))}`);
    }
  }
}

function bigModule(name: string, kb: number): string {
  let source = `module ${name}(input a, b, output y);\n`;
  for (let i = 0; source.length < kb * 1024; i++)
    source += `  wire w${i} = a ^ b ^ ${i % 2}; // xxxxxxxx\n`;
  return `${source}  assign y = w0;\nendmodule\n`;
}

/** Compilacao de dois arquivos no teto de tamanho — o pior caso que o contrato aceita. */
async function measureCap(): Promise<void> {
  const kb = MAX_SOURCE_BYTES / 1024;
  const files = {
    'big.v': bigModule('big', kb),
    'tbmod.v': bigModule('tbmod', kb),
    'tb.v':
      'module tb; reg a=0,b=1; wire y,y2; big d(.a(a),.b(b),.y(y)); tbmod t(.a(a),.b(b),.y(y2)); initial begin #1 $display("y=%b",y); $finish; end endmodule\n',
  };
  console.log(`\n## compilacao de 2 arquivos de ${kb} KB (MAX_SOURCE_BYTES)`);
  const runs: Sample[] = [];
  for (let i = 0; i < 4; i++) {
    const sample = await runCase({ files });
    if (i > 0) runs.push(sample);
  }
  console.log(`  compileMs  ${summarize(runs.map((run) => run.compileMs))}`);
  console.log(`  peakMb     ${summarize(runs.map((run) => run.peakMb))}`);
}

async function measureCpu(): Promise<void> {
  for (const name of ['pesado16', 'ram1m']) {
    for (const cpus of [0.25, 0.5, 1, 2]) {
      const runs: Sample[] = [];
      for (let i = 0; i < 6; i++) {
        const sample = await runCase(CASES[name] as Case, cpus);
        if (i > 0) runs.push(sample);
      }
      console.log(`${name} cpus=${cpus}: simMs ${summarize(runs.map((run) => run.simMs))}`);
    }
  }
}

const [first, ...rest] = process.argv.slice(2);
if (first === 'cap') await measureCap();
else if (first === 'cpu') await measureCpu();
else {
  const samples = Number(first ?? 20);
  await measureExamples(samples, rest.length > 0 ? rest : Object.keys(CASES));
}

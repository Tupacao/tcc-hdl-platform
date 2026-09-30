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
import { CASES, type Case } from './examples.js';
import {
  buildSandboxContainerOptions,
  defaultSandboxLimits,
} from '../src/modules/simulation/sandbox.js';

const docker = new Docker();

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

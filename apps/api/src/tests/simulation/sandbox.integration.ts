/**
 * Auditoria repetivel do sandbox contra Docker de verdade (RNF04-I01/I03, RNF05-I01).
 * Fora do glob `*.test.ts` de `pnpm test` (e lenta e exige a imagem construida);
 * rodar com `pnpm sandbox:build && pnpm --filter @tplab/api test:sandbox`.
 * Qualquer alteracao em `sandbox.ts`, no Dockerfile ou em `run-simulation.sh`
 * exige repetir — os resultados registrados estao em `docs/SEGURANCA.md`.
 */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import Docker from 'dockerode';
import type { HdlSources } from '@tplab/shared';
import { execFileSync } from 'node:child_process';
import {
  buildSandboxContainerOptions,
  defaultSandboxLimits,
  dockerSupportsSwapLimit,
  mapFailure,
  runInSandbox,
} from '../../infra/sandbox/sandbox.js';
import type { SandboxLimits } from '../../domain/simulation/entities/sandbox.js';
import { VERILOG_TOOLCHAIN } from '../../application/simulation/service/toolchains.js';

const docker = new Docker();

/** Limites e toolchain que a API usa de verdade — `runInSandbox` nao tem mais valor padrao. */
const DEFAULT_LIMITS = defaultSandboxLimits(VERILOG_TOOLCHAIN);

function run(
  sources: Pick<HdlSources, 'design' | 'testbench'>,
  limits: SandboxLimits = DEFAULT_LIMITS,
) {
  return runInSandbox(sources, limits, VERILOG_TOOLCHAIN);
}

// Sem SwapLimit o OOM nao e deterministico (o processo pagina): os testes de memoria so valem com ele.
const swapLimit = await dockerSupportsSwapLimit();
const SKIP_MEMORY = swapLimit ? false : 'Docker sem SwapLimit (ver dockerSupportsSwapLimit)';

const DESIGN = {
  name: 'dut.v',
  content: 'module dut(input a, output b);\n assign b = a;\nendmodule\n',
};

function sources(testbench: string): HdlSources {
  return {
    language: 'verilog',
    design: DESIGN,
    testbench: { name: 'tb.v', content: testbench },
    topModule: 'tb',
  };
}

/** Roda um comando de shell no container, com as MESMAS opcoes de `runInSandbox`. */
async function shell(
  command: string,
  override: { memoryMb?: number } = {},
): Promise<{ exitCode: number; oomKilled: boolean; output: string }> {
  const workdir = await mkdtemp(join(tmpdir(), 'hdl-sim-integration-'));
  await writeFile(join(workdir, 'dut.v'), DESIGN.content);
  const options = buildSandboxContainerOptions(workdir, DEFAULT_LIMITS);
  options.Entrypoint = ['/bin/sh', '-c'];
  options.Cmd = [command];
  if (override.memoryMb) {
    const bytes = override.memoryMb * 1024 * 1024;
    options.HostConfig = { ...options.HostConfig, Memory: bytes, MemorySwap: bytes };
  }
  const container = await docker.createContainer(options);
  try {
    await container.start();
    const { StatusCode } = (await container.wait()) as { StatusCode: number };
    const info = await container.inspect();
    // Container cujo PID 1 morreu por OOM pode recusar `logs` (409) — o achado e tratado em RNF05-I01.
    const logs = await container
      .logs({ stdout: true, stderr: true })
      .then((buffer) => (buffer as unknown as Buffer).toString('utf8'))
      .catch(() => '');
    return { exitCode: StatusCode, oomKilled: info.State.OOMKilled, output: logs };
  } finally {
    await container.remove({ force: true }).catch(() => undefined);
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

test('rede: sem rota para fora e so a interface de loopback', async () => {
  const { output } = await shell(
    'wget -T 3 -qO- http://1.1.1.1 2>&1; echo rc=$?; ls /sys/class/net',
  );
  assert.match(output, /Network unreachable/);
  assert.match(output, /rc=1/);
  assert.match(output, /\blo\b/);
  assert.doesNotMatch(output, /eth0/);
});

test('escrita: rootfs somente leitura; so o workdir aceita escrita', async () => {
  const { output } = await shell(
    'touch /etc/x 2>&1; echo etc=$?; touch /usr/x 2>&1; echo usr=$?; touch /work/../x 2>&1; echo dotdot=$?; touch /work/ok; echo work=$?',
  );
  assert.match(output, /etc=1/);
  assert.match(output, /usr=1/);
  assert.match(output, /dotdot=1/);
  assert.match(output, /work=0/);
});

test('/tmp: gravar um script e executa-lo falha (noexec)', async () => {
  const { output } = await shell(
    "echo 'echo EXEC' > /tmp/x.sh; chmod +x /tmp/x.sh; /tmp/x.sh; echo rc=$?",
  );
  assert.match(output, /Permission denied/);
  assert.match(output, /rc=126/);
  assert.doesNotMatch(output, /^EXEC$/m);
});

test('privilegio: usuario sandbox, zero capabilities, no-new-privileges ativo', async () => {
  const { output } = await shell("id -u; grep -E 'CapEff|CapBnd|NoNewPrivs' /proc/self/status");
  assert.match(output, /10001/);
  assert.match(output, /CapEff:\s+0000000000000000/);
  assert.match(output, /CapBnd:\s+0000000000000000/);
  assert.match(output, /NoNewPrivs:\s+1/);
});

test('ambiente: so SIM_TIMEOUT_S; nenhuma variavel da API e sem socket do Docker', async () => {
  const { output } = await shell('env | sort; ls /var/run/docker.sock 2>&1');
  assert.match(output, /SIM_TIMEOUT_S=/);
  assert.doesNotMatch(output, /DATABASE_URL|REDIS_URL|SECRET|TOKEN/);
  assert.match(output, /No such file/);
});

test('PIDs: laco de fork e contido pelo limite', async () => {
  const { output } = await shell(
    'i=0; while [ $i -lt 400 ]; do sleep 3 & i=$((i+1)); done 2>&1 | tail -1; wait',
  );
  assert.match(output, /can't fork|Resource temporarily unavailable/);
});

test(
  'memoria: estouro mata o container e o Docker marca OOMKilled',
  { skip: SKIP_MEMORY },
  async () => {
    const { exitCode, oomKilled } = await shell('a=x; while true; do a="$a$a"; done', {
      memoryMb: 64,
    });
    assert.equal(exitCode, 137);
    assert.equal(oomKilled, true);
  },
);

test('Verilog: $fopen fora do workdir falha e dentro funciona', async () => {
  const outcome = await run(
    sources(`module tb; integer a, b, c;
  initial begin
    a = $fopen("/etc/pwn", "w"); b = $fopen("/work/../pwn", "w"); c = $fopen("/work/ok.txt", "w");
    $display("etc=%0d dotdot=%0d work_ok=%0d", a, b, c != 0);
    $finish;
  end
endmodule`),
  );
  assert.equal(outcome.failure, null);
  assert.match(outcome.stdout, /etc=0 dotdot=0 work_ok=1/);
});

test('Verilog: $dumpfile fora do workdir e recusado', async () => {
  const outcome = await run(
    sources(
      'module tb; initial begin $dumpfile("/etc/x.vcd"); $dumpvars(0, tb); $finish; end endmodule',
    ),
  );
  assert.equal(outcome.failure, 'runtime_error');
  assert.match(outcome.stdout, /Unable to open \/etc\/x\.vcd/);
  assert.equal(outcome.vcd, null);
});

test('Verilog: $system nao existe nesta build do Icarus (sem execucao de comando)', async () => {
  const outcome = await run(
    sources('module tb; initial begin $system("id"); $finish; end endmodule'),
  );
  assert.equal(outcome.failure, 'runtime_error');
  assert.match(outcome.stderr, /\$system\(\) is not defined/);
});

test('Verilog: `include de caminho absoluto le so o que ja esta na imagem', async () => {
  const outcome = await run(
    sources('module tb; initial $finish;\n`include "/etc/passwd"\nendmodule'),
  );
  assert.equal(outcome.failure, 'compile_error');
  assert.doesNotMatch(outcome.stdout + outcome.stderr, /sandbox:x:10001/);
});

test('uso legitimo continua funcionando ($dumpfile relativo, $display)', async () => {
  const outcome = await run(
    sources(`module tb; reg a; wire b; dut u(.a(a), .b(b));
  initial begin $dumpfile("wave.vcd"); $dumpvars(0, tb); a = 1; #5 $display("b=%b", b); $finish; end
endmodule`),
  );
  assert.equal(outcome.failure, null);
  assert.match(outcome.stdout, /b=1/);
  assert.ok(outcome.vcd && outcome.vcd.includes('$var'));
});

// RNF05-I01 — cada limite dispara e produz o desfecho correto.

const FAST: SandboxLimits = {
  ...DEFAULT_LIMITS,
  timeoutMs: 3_000,
  compileTimeoutMs: 2_000,
};

test('tempo: simulacao sem $finish termina no limite e reporta timeout da simulacao', async () => {
  const outcome = await run(
    sources('module tb; reg a; initial a = 0; always #1 a = ~a; endmodule'),
    FAST,
  );
  assert.equal(outcome.failure, 'timeout');
  assert.equal(outcome.timeoutPhase, 'simulate');
  assert.equal(outcome.exitCode, 124);
  assert.equal(outcome.oomKilled, false);
});

test('tempo: compilacao que nao termina (macro recursiva) e interrompida e distinguivel (fase compile)', async () => {
  const started = Date.now();
  const outcome = await run(
    sources(
      '`define A `B\n`define B `A\nmodule tb; initial begin $display(`A); $finish; end endmodule',
    ),
    FAST,
  );
  assert.equal(outcome.failure, 'timeout');
  assert.equal(outcome.timeoutPhase, 'compile');
  assert.equal(outcome.exitCode, 4);
  // Antes de RNF05-I01 ficava preso ate o killTimer do host (limites + 5 s).
  assert.ok(
    Date.now() - started < 3_000 + 2_000 + 5_000,
    'o iverilog nao foi coberto pelo timeout',
  );
});

test('`include circular termina rapido, sem prender o worker (o limite de descritores corta a recursao)', async () => {
  const started = Date.now();
  const outcome = await run(
    sources('`include "tb.v"\nmodule tb; initial $finish; endmodule'),
    FAST,
  );
  assert.notEqual(outcome.timeoutPhase, 'host');
  assert.ok(Date.now() - started < 10_000);
  assert.match(outcome.stderr, /Include file tb\.v not found/);
});

test(
  'memoria: estouro reporta memory_limit confirmado pelo OOMKilled (nao timeout)',
  { skip: SKIP_MEMORY },
  async () => {
    const outcome = await run(
      sources(
        'module tb; reg [31:0] mem [0:100000000]; integer i; initial begin for (i = 0; i < 100000000; i = i + 1) mem[i] = i; $finish; end endmodule',
      ),
      { ...FAST, timeoutMs: 20_000, memoryMb: 32 },
    );
    assert.equal(outcome.failure, 'memory_limit');
    assert.equal(outcome.oomKilled, true);
  },
);

test('SIGKILL sem OOM (processo filho morto por kill -9) NAO vira memory_limit', async () => {
  // kill -9 no PID 1 e ignorado pelo kernel dentro do proprio namespace: mata-se um filho.
  const { exitCode, oomKilled } = await shell(
    'sleep 30 & pid=$!; kill -9 $pid; wait $pid; exit $?',
  );
  assert.equal(exitCode, 137);
  assert.equal(oomKilled, false);
  assert.equal(mapFailure(exitCode, { oomKilled }), 'internal_error');
});

test('variaveis SANDBOX_* mudam o comportamento efetivo (entram nos limites e no container)', () => {
  const script =
    'Promise.all([import("./src/infra/sandbox/sandbox.ts"), import("./src/application/simulation/service/toolchains.ts")]).then(([m, t]) => { const l = m.defaultSandboxLimits(t.VERILOG_TOOLCHAIN); const o = m.buildSandboxContainerOptions("/w", l); console.log(JSON.stringify({ l, env: o.Env, mem: o.HostConfig.Memory, cpu: o.HostConfig.NanoCpus })); })';
  const out = execFileSync(process.execPath, ['--import', 'tsx', '-e', script], {
    env: {
      ...process.env,
      SANDBOX_TIMEOUT_MS: '4000',
      SANDBOX_COMPILE_TIMEOUT_MS: '2000',
      SANDBOX_MEMORY_MB: '48',
      SANDBOX_CPUS: '0.25',
    },
    cwd: new URL('../../../', import.meta.url),
  }).toString();
  const parsed = JSON.parse(out) as { l: SandboxLimits; env: string[]; mem: number; cpu: number };
  assert.equal(parsed.l.timeoutMs, 4000);
  assert.equal(parsed.l.compileTimeoutMs, 2000);
  assert.deepEqual(parsed.env, ['SIM_TIMEOUT_S=4', 'SIM_COMPILE_TIMEOUT_S=2']);
  assert.equal(parsed.mem, 48 * 1024 * 1024);
  assert.equal(parsed.cpu, 0.25e9);
});

// RNF04-I03 — vetores especificos da toolchain Verilog.

test('leitura: $fopen/$fgets le so o que ja esta na imagem; o ambiente nao tem segredos', async () => {
  const outcome = await run(
    sources(`module tb;
  integer fd, r;
  reg [8*200-1:0] line;
  initial begin
    fd = $fopen("/etc/passwd", "r");
    r = $fgets(line, fd);
    $display("passwd=%0s", line);
    fd = $fopen("/proc/self/environ", "r");
    r = $fgets(line, fd);
    $display("environ=%0s", line);
    $finish;
  end
endmodule`),
  );
  assert.equal(outcome.failure, null);
  assert.match(outcome.stdout, /passwd=root:x:0:0/);
  assert.doesNotMatch(outcome.stdout, /DATABASE_URL|REDIS_URL|SECRET|TOKEN|PASSWORD/i);
});

test('disco: $fwrite em laco para em 16 MiB (RLIMIT_FSIZE) e vira runtime_error com exit 153', async () => {
  const outcome = await run(
    sources(`module tb;
  integer fd, i;
  initial begin
    fd = $fopen("/work/flood.txt", "w");
    for (i = 0; i < 2000000000; i = i + 1)
      $fwrite(fd, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\\n");
    $finish;
  end
endmodule`),
  );
  assert.equal(outcome.exitCode, 153);
  assert.equal(outcome.failure, 'runtime_error');
});

test('disco: $dumpvars em laco tambem para em 16 MiB, e o VCD parcial ainda chega cortado a 2 MiB', async () => {
  const outcome = await run(
    sources(`module tb;
  reg [63:0] a;
  integer i;
  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    for (i = 0; i < 2000000000; i = i + 1) begin
      a = i * 64'h9E3779B97F4A7C15;
      #1;
    end
    $finish;
  end
endmodule`),
  );
  assert.equal(outcome.exitCode, 153);
  assert.ok(outcome.vcd, 'o VCD parcial deveria chegar');
  assert.ok(outcome.vcd.length <= 2 * 1024 * 1024);
  assert.equal(outcome.truncated.vcd, true);
});

test('log: $display em laco nao estoura o docker-modem e as ultimas linhas chegam', async () => {
  const outcome = await run(
    sources(`module tb;
  integer i;
  initial begin
    for (i = 0; i < 2000000000; i = i + 1)
      $display("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    $finish;
  end
endmodule`),
    { ...FAST, timeoutMs: 5_000 },
  );
  assert.equal(outcome.failure, 'timeout');
  assert.equal(outcome.truncated.stdout, true);
  assert.ok(outcome.stdout.length <= 256 * 1024 + 100);
});

test('log: o container tem rotacao configurada (1 MiB x 2)', async () => {
  const workdir = await mkdtemp(join(tmpdir(), 'hdl-sim-integration-'));
  const container = await docker.createContainer(
    buildSandboxContainerOptions(workdir, DEFAULT_LIMITS),
  );
  try {
    const info = await container.inspect();
    assert.deepEqual(info.HostConfig.LogConfig?.Config, { 'max-size': '1m', 'max-file': '2' });
  } finally {
    await container.remove({ force: true }).catch(() => undefined);
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
});

test('limpeza: nenhum container do sandbox fica para tras', async () => {
  const left = await docker.listContainers({
    all: true,
    filters: { label: ['tplab.sandbox=true'] },
  });
  assert.equal(left.length, 0, `containers orfaos: ${left.map((c) => c.Id).join(', ')}`);
});

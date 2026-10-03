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
import { buildSandboxContainerOptions, runInSandbox } from './sandbox.js';

const docker = new Docker();

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
  const options = buildSandboxContainerOptions(workdir);
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

test('memoria: estouro mata o container e o Docker marca OOMKilled', async () => {
  const { exitCode, oomKilled } = await shell('a=x; while true; do a="$a$a"; done', {
    memoryMb: 64,
  });
  assert.equal(exitCode, 137);
  assert.equal(oomKilled, true);
});

test('Verilog: $fopen fora do workdir falha e dentro funciona', async () => {
  const outcome = await runInSandbox(
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
  const outcome = await runInSandbox(
    sources(
      'module tb; initial begin $dumpfile("/etc/x.vcd"); $dumpvars(0, tb); $finish; end endmodule',
    ),
  );
  assert.equal(outcome.failure, 'runtime_error');
  assert.match(outcome.stdout, /Unable to open \/etc\/x\.vcd/);
  assert.equal(outcome.vcd, null);
});

test('Verilog: $system nao existe nesta build do Icarus (sem execucao de comando)', async () => {
  const outcome = await runInSandbox(
    sources('module tb; initial begin $system("id"); $finish; end endmodule'),
  );
  assert.equal(outcome.failure, 'runtime_error');
  assert.match(outcome.stderr, /\$system\(\) is not defined/);
});

test('Verilog: `include de caminho absoluto le so o que ja esta na imagem', async () => {
  const outcome = await runInSandbox(
    sources('module tb; initial $finish;\n`include "/etc/passwd"\nendmodule'),
  );
  assert.equal(outcome.failure, 'compile_error');
  assert.doesNotMatch(outcome.stdout + outcome.stderr, /sandbox:x:10001/);
});

test('uso legitimo continua funcionando ($dumpfile relativo, $display)', async () => {
  const outcome = await runInSandbox(
    sources(`module tb; reg a; wire b; dut u(.a(a), .b(b));
  initial begin $dumpfile("wave.vcd"); $dumpvars(0, tb); a = 1; #5 $display("b=%b", b); $finish; end
endmodule`),
  );
  assert.equal(outcome.failure, null);
  assert.match(outcome.stdout, /b=1/);
  assert.ok(outcome.vcd && outcome.vcd.includes('$var'));
});

test('limpeza: nenhum container do sandbox fica para tras', async () => {
  const left = await docker.listContainers({
    all: true,
    filters: { label: ['tplab.sandbox=true'] },
  });
  assert.equal(left.length, 0, `containers orfaos: ${left.map((c) => c.Id).join(', ')}`);
});

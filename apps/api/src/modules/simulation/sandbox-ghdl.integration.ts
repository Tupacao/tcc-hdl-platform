/**
 * RNF08-I02 — a segunda toolchain (GHDL) de ponta a ponta contra o Docker REAL, pelo mesmo
 * `runInSandbox` e com as mesmas barreiras de RNF04/RNF05. Requer `docker build -t
 * tplab-sandbox-ghdl:latest infra/sandbox-ghdl`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultSandboxLimits, runInSandbox } from './sandbox.js';
import { VHDL_TOOLCHAIN } from './toolchains.js';

const COUNTER = `library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity counter is port (clk, rst : in std_logic; q : out unsigned(3 downto 0)); end entity;
architecture rtl of counter is signal c : unsigned(3 downto 0) := (others => '0'); begin
  process (clk) begin
    if rising_edge(clk) then
      if rst = '1' then c <= (others => '0'); else c <= c + 1; end if;
    end if;
  end process;
  q <= c;
end architecture;
`;

const TESTBENCH = `library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity tb is end entity;
architecture sim of tb is signal clk, rst : std_logic := '0'; signal q : unsigned(3 downto 0); begin
  dut: entity work.counter port map (clk, rst, q);
  clk <= not clk after 5 ns;
  process begin
    rst <= '1'; wait for 12 ns; rst <= '0'; wait for 100 ns;
    report "q=" & integer'image(to_integer(q));
    wait;
  end process;
  process begin wait for 200 ns; std.env.finish; end process;
end architecture;
`;

function run(design: string, testbench: string) {
  return runInSandbox(
    {
      design: { name: 'counter.vhd', content: design },
      testbench: { name: 'tb.vhd', content: testbench },
    },
    defaultSandboxLimits(VHDL_TOOLCHAIN),
    VHDL_TOOLCHAIN,
  );
}

test('VHDL: contador simula, gera o .vcd e fala no mesmo formato de resultado', async () => {
  const outcome = await run(COUNTER, TESTBENCH);
  assert.equal(outcome.failure, null, outcome.stderr);
  assert.equal(outcome.exitCode, 0);
  assert.ok(outcome.vcd?.includes('$var'), 'o VCD do GHDL deveria chegar');
  assert.equal(outcome.artifacts.vcd, outcome.vcd);
  assert.match(outcome.stdout + outcome.stderr, /q=10/);
  assert.notEqual(outcome.timings.compileMs, null);
  assert.notEqual(outcome.timings.simulateMs, null);
});

test('VHDL: erro de analise vira compile_error (codigo 2) com linha e coluna', async () => {
  const outcome = await run(COUNTER.replace('c + 1', 'c + x'), TESTBENCH);
  assert.equal(outcome.failure, 'compile_error');
  assert.equal(outcome.exitCode, 2);
  const diagnostics = VHDL_TOOLCHAIN.parseDiagnostics(outcome.stderr, ['counter.vhd', 'tb.vhd']);
  assert.equal(diagnostics[0]?.file, 'counter.vhd');
  assert.equal(diagnostics[0]?.line, 6);
  assert.equal(outcome.vcd, null);
});

test('VHDL: laco sem fim termina por timeout, com o mesmo limite do Verilog (RNF05)', async () => {
  // Laco sem `wait`: nenhum evento, nenhum VCD crescendo — so o relogio do limite de tempo o para.
  const forever = TESTBENCH.replace(
    'process begin wait for 200 ns; std.env.finish; end process;',
    'process begin loop null; end loop; end process;',
  );
  const outcome = await runInSandbox(
    {
      design: { name: 'counter.vhd', content: COUNTER },
      testbench: { name: 'tb.vhd', content: forever },
    },
    { ...defaultSandboxLimits(VHDL_TOOLCHAIN), timeoutMs: 2_000 },
    VHDL_TOOLCHAIN,
  );
  assert.equal(outcome.failure, 'timeout');
  assert.equal(outcome.exitCode, 124);
});

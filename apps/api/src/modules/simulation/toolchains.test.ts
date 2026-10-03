import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CompileRequestSchema, JobKindSchema } from '@tplab/shared';
import { readArtifacts } from './sandbox.js';
import { TOOLCHAINS, VERILOG_TOOLCHAIN, toolchainFor, type ArtifactSpec } from './toolchains.js';

const sources = {
  design: { name: 'd.v', content: 'module d; endmodule' },
  testbench: { name: 'tb.v', content: 'module tb; endmodule' },
  topModule: 'tb',
};

test('kind e opcional no contrato e cai no padrao Verilog', () => {
  const parsed = CompileRequestSchema.parse(sources);
  assert.equal(parsed.kind, undefined);
  assert.equal(toolchainFor(parsed.kind), VERILOG_TOOLCHAIN);
  assert.equal(
    CompileRequestSchema.parse({ ...sources, kind: 'simulate-verilog' }).kind,
    'simulate-verilog',
  );
  assert.equal(CompileRequestSchema.safeParse({ ...sources, kind: 'synth-yosys' }).success, false);
});

test('todo JobKind do contrato tem toolchain registrada, com o mesmo kind', () => {
  for (const kind of JobKindSchema.options) {
    assert.equal(TOOLCHAINS[kind].kind, kind);
  }
});

test('a toolchain Verilog escolhe o parser do Icarus e declara o artefato vcd', () => {
  const diagnostics = VERILOG_TOOLCHAIN.parseDiagnostics('d.v:3: syntax error', ['d.v']);
  assert.equal(diagnostics[0]?.file, 'd.v');
  assert.deepEqual(
    VERILOG_TOOLCHAIN.artifacts.map((a) => a.name),
    ['vcd'],
  );
});

test('readArtifacts le por padrao, aplica o teto de cada artefato e ignora link simbolico', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tplab-art-'));
  try {
    await writeFile(join(dir, 'wave.vcd'), 'linha1\nlinha2\nlinha3\n');
    await writeFile(join(dir, 'report.txt'), 'ok');
    await symlink(join(dir, 'report.txt'), join(dir, 'link.log')).catch(() => undefined);
    const specs: ArtifactSpec[] = [
      { name: 'vcd', filePattern: /\.vcd$/, maxBytes: () => 14 },
      { name: 'report', filePattern: /\.txt$/, maxBytes: () => 100 },
      { name: 'log', filePattern: /\.log$/, maxBytes: () => 100 },
      { name: 'netlist', filePattern: /\.json$/, maxBytes: () => 100 },
    ];
    const result = await readArtifacts(dir, specs);

    assert.deepEqual(result.vcd, { text: 'linha1\nlinha2\n', truncated: true });
    assert.deepEqual(result.report, { text: 'ok', truncated: false });
    assert.equal(result.log?.text, null);
    assert.deepEqual(result.netlist, { text: null, truncated: false });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseGhdlDiagnostics } from './diagnostics-ghdl.js';

test('erro de analise sem prefixo: arquivo, linha e coluna, sem o eco do codigo', () => {
  const output = [
    '/work/counter.vhd:4:102: no declaration for "x"',
    '  process (clk) begin c <= c + x; end process;',
    '                                ^',
  ].join('\n');
  const diagnostics = parseGhdlDiagnostics(output, ['counter.vhd', 'tb.vhd']);

  assert.equal(diagnostics.length, 1);
  assert.deepEqual(
    { ...diagnostics[0], raw: undefined },
    {
      severity: 'error',
      file: 'counter.vhd',
      line: 4,
      column: 102,
      message: 'no declaration for "x"',
      raw: undefined,
      title: null,
      hint: null,
    },
  );
});

test('warning vem colado na coluna', () => {
  const [diagnostic] = parseGhdlDiagnostics('/work/tb.vhd:3:5:warning: signal "s" is never read', [
    'tb.vhd',
  ]);
  assert.equal(diagnostic?.severity, 'warning');
  assert.equal(diagnostic?.message, 'signal "s" is never read');
});

test('report note nao e diagnostico; assertion error e erro; warning de assert e aviso', () => {
  const output = [
    '/work/tb.vhd:6:74:@112ns:(report note): q=10',
    '/work/tb.vhd:7:3:@120ns:(assertion error): valor inesperado',
    '/work/tb.vhd:8:3:@130ns:(assertion warning): quase',
    'simulation finished @200ns',
  ].join('\n');
  const diagnostics = parseGhdlDiagnostics(output, ['tb.vhd']);

  assert.deepEqual(
    diagnostics.map((d) => [d.severity, d.line, d.message]),
    [
      ['error', 7, 'valor inesperado'],
      ['warning', 8, 'quase'],
    ],
  );
});

test('linha do proprio ghdl e linha desconhecida nao se perdem; resumos sao ignorados', () => {
  const diagnostics = parseGhdlDiagnostics(
    ['ghdl: cannot find entity "foo"', 'algo inesperado', 'compilation error'].join('\n'),
  );
  assert.deepEqual(
    diagnostics.map((d) => [d.severity, d.file, d.line, d.message]),
    [
      ['error', '', null, 'cannot find entity "foo"'],
      ['error', '', null, 'algo inesperado'],
    ],
  );
});

test('nome de arquivo desconhecido e mantido, nao inventado', () => {
  const [diagnostic] = parseGhdlDiagnostics('/work/outro.vhd:1:1: erro', ['tb.vhd']);
  assert.equal(diagnostic?.file, '/work/outro.vhd');
});

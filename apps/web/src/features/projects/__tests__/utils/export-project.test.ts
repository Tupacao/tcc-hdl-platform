import assert from 'node:assert/strict';
import { test } from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import type { HdlSources } from '@tplab/shared';
import { buildExportFileName, buildProjectZip } from '../../utils/export-project';
import type { ExportableProjectMeta } from '../../utils/export-project';

const meta: ExportableProjectMeta = {
  id: 'abc123',
  name: 'contador',
  description: 'Contador de 4 bits',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const sources: HdlSources = {
  language: 'verilog',
  topModule: 'contador_tb',
  design: { name: 'contador.v', content: 'module contador(); endmodule\n' },
  testbench: { name: 'contador_tb.v', content: 'module contador_tb(); endmodule\n' },
};

test('buildProjectZip inclui design e testbench com o conteudo exato', () => {
  const zip = unzipSync(buildProjectZip(meta, sources));
  assert.equal(strFromU8(zip['contador.v']!), sources.design.content);
  assert.equal(strFromU8(zip['contador_tb.v']!), sources.testbench.content);
});

test('buildProjectZip inclui project.json com os metadados esperados', () => {
  const zip = unzipSync(buildProjectZip(meta, sources));
  const metadata = JSON.parse(strFromU8(zip['project.json']!));

  assert.equal(metadata.id, meta.id);
  assert.equal(metadata.name, meta.name);
  assert.equal(metadata.description, meta.description);
  assert.equal(metadata.topModule, sources.topModule);
  assert.equal(metadata.language, sources.language);
  assert.equal(metadata.createdAt, meta.createdAt);
  assert.equal(metadata.updatedAt, meta.updatedAt);
  assert.equal(typeof metadata.exportedAt, 'string');
  assert.equal(typeof metadata.formatVersion, 'number');
});

test('buildProjectZip inclui README.txt com os nomes reais dos arquivos', () => {
  const zip = unzipSync(buildProjectZip(meta, sources));
  const readme = strFromU8(zip['README.txt']!);

  assert.match(readme, /contador\.v/);
  assert.match(readme, /contador_tb\.v/);
  assert.match(readme, /iverilog/);
});

test('buildProjectZip exporta as fontes recebidas, nao as do projeto salvo', () => {
  const liveSources: HdlSources = {
    ...sources,
    design: { ...sources.design, content: 'module contador(); // editado\nendmodule\n' },
  };
  const zip = unzipSync(buildProjectZip(meta, liveSources));
  assert.equal(strFromU8(zip['contador.v']!), liveSources.design.content);
});

test('buildExportFileName usa o nome do projeto', () => {
  assert.equal(buildExportFileName('contador', 'abc123'), 'contador.zip');
});

test('buildExportFileName remove acentos', () => {
  assert.equal(
    buildExportFileName('Somador Completo - versao final', 'abc123'),
    'Somador Completo - versao final.zip',
  );
  assert.equal(buildExportFileName('projeto com ç e ã', 'abc123'), 'projeto com c e a.zip');
});

test('buildExportFileName remove caracteres invalidos no Windows', () => {
  assert.equal(buildExportFileName('a<b>c:d"e/f\\g|h?i*j', 'abc123'), 'abcdefghij.zip');
});

test('buildExportFileName trunca nomes muito longos', () => {
  const longName = 'a'.repeat(100);
  const result = buildExportFileName(longName, 'abc123');
  assert.equal(result, `${'a'.repeat(60)}.zip`);
});

test('buildExportFileName cai para projeto-<id> quando o nome fica vazio depois de sanear', () => {
  assert.equal(buildExportFileName('///', 'abc123'), 'projeto-abc123.zip');
});

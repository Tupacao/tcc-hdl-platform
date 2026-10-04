import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { DOT_ENV_PATH, loadDotEnv } from '../../config/env.js';

/**
 * `loadDotEnv` é a correção do bug em que a API subia com os repositórios em
 * memória mesmo com `DATABASE_URL` preenchida no `apps/api/.env`: nenhum ponto do
 * processo lia o arquivo. O teste fixa as duas garantias que sustentam isso — o
 * arquivo preenche o que falta, e o ambiente real continua ganhando dele.
 */

const diretorio = mkdtempSync(join(tmpdir(), 'tplab-env-'));

after(() => rmSync(diretorio, { recursive: true, force: true }));

function arquivoEnv(conteudo: string): string {
  const caminho = join(diretorio, `${Math.random().toString(36).slice(2)}.env`);
  writeFileSync(caminho, conteudo, 'utf8');
  return caminho;
}

test('preenche variável ausente a partir do arquivo', () => {
  delete process.env.TPLAB_TESTE_AUSENTE;

  loadDotEnv(arquivoEnv('TPLAB_TESTE_AUSENTE=do-arquivo\n'));

  assert.equal(process.env.TPLAB_TESTE_AUSENTE, 'do-arquivo');
});

test('não sobrescreve variável já definida no ambiente', () => {
  process.env.TPLAB_TESTE_DEFINIDA = 'do-ambiente';

  loadDotEnv(arquivoEnv('TPLAB_TESTE_DEFINIDA=do-arquivo\n'));

  // Garantia que torna a chamada segura em produção, onde o compose injeta tudo.
  assert.equal(process.env.TPLAB_TESTE_DEFINIDA, 'do-ambiente');
});

test('arquivo inexistente não derruba o processo', () => {
  assert.doesNotThrow(() => loadDotEnv(join(diretorio, 'nao-existe.env')));
});

test('o caminho padrão aponta para apps/api/.env', () => {
  // Resolvido pelo módulo, não pelo diretório de trabalho: `pnpm dev`, o worker e
  // os testes rodam de lugares diferentes e precisam achar o mesmo arquivo.
  assert.match(DOT_ENV_PATH.pathname, /\/apps\/api\/\.env$/);
});

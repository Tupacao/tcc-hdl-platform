import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildCopyName,
  PROJECT_NAME_MAX_LENGTH,
  validateProjectName,
} from '../../utils/validation';

test('validateProjectName aceita um nome de identificador valido e unico', () => {
  assert.equal(validateProjectName('contador_v2', ['outro_projeto']), null);
});

test('validateProjectName rejeita nome vazio (so espacos)', () => {
  assert.match(validateProjectName('   ', []) ?? '', /Informe um nome/);
});

test('validateProjectName aceita um nome exatamente no limite maximo', () => {
  const atLimit = 'a'.repeat(PROJECT_NAME_MAX_LENGTH);
  assert.equal(validateProjectName(atLimit, []), null);
});

test('validateProjectName rejeita nome acima do limite maximo', () => {
  const long = 'a'.repeat(PROJECT_NAME_MAX_LENGTH + 1);
  assert.match(validateProjectName(long, []) ?? '', /máximo 35/);
});

test('validateProjectName rejeita caracteres fora de letras/numeros/sublinhado', () => {
  assert.match(validateProjectName('meu projeto!', []) ?? '', /letras, números e sublinhado/i);
});

test('validateProjectName rejeita nome comecando com numero', () => {
  assert.match(validateProjectName('1projeto', []) ?? '', /letras, números e sublinhado/i);
});

test('validateProjectName rejeita duplicata ignorando maiusculas/minusculas', () => {
  assert.match(
    validateProjectName('Contador', ['contador']) ?? '',
    /Já existe um projeto com esse nome/,
  );
});

test('buildCopyName acrescenta _copia quando nao ha conflito', () => {
  assert.equal(buildCopyName('contador', []), 'contador_copia');
});

test('buildCopyName numera a partir de _copia2 se _copia ja existir', () => {
  assert.equal(buildCopyName('contador', ['contador_copia']), 'contador_copia2');
  assert.equal(buildCopyName('contador', ['contador_copia', 'contador_copia2']), 'contador_copia3');
});

test('buildCopyName trunca a base para nunca passar do limite maximo', () => {
  const longName = 'a'.repeat(PROJECT_NAME_MAX_LENGTH);
  const copy = buildCopyName(longName, []);
  assert.ok(copy.length <= PROJECT_NAME_MAX_LENGTH);
  assert.match(copy, /_copia$/);
});

test('buildCopyName continua dentro do limite mesmo numerando varias copias', () => {
  const longName = 'a'.repeat(PROJECT_NAME_MAX_LENGTH);
  const existing = [`${longName.slice(0, PROJECT_NAME_MAX_LENGTH - '_copia'.length)}_copia`];
  const copy = buildCopyName(longName, existing);
  assert.ok(copy.length <= PROJECT_NAME_MAX_LENGTH);
  assert.match(copy, /_copia2$/);
});

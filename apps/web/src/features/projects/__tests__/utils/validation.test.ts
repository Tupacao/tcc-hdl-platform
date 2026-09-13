import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateProjectName } from '../../utils/validation';

test('validateProjectName aceita um nome de identificador valido e unico', () => {
  assert.equal(validateProjectName('contador_v2', ['outro_projeto']), null);
});

test('validateProjectName rejeita nome vazio (so espacos)', () => {
  assert.match(validateProjectName('   ', []) ?? '', /Informe um nome/);
});

test('validateProjectName rejeita nome com mais de 120 caracteres', () => {
  const long = 'a'.repeat(121);
  assert.match(validateProjectName(long, []) ?? '', /maximo 120/);
});

test('validateProjectName rejeita caracteres fora de letras/numeros/sublinhado', () => {
  assert.match(validateProjectName('meu projeto!', []) ?? '', /letras, numeros e sublinhado/i);
});

test('validateProjectName rejeita nome comecando com numero', () => {
  assert.match(validateProjectName('1projeto', []) ?? '', /letras, numeros e sublinhado/i);
});

test('validateProjectName rejeita duplicata ignorando maiusculas/minusculas', () => {
  assert.match(
    validateProjectName('Contador', ['contador']) ?? '',
    /Ja existe um projeto com esse nome/,
  );
});

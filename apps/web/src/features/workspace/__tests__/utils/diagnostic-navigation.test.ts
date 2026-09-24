import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic } from '@tplab/shared';
import { cycleIndex, navigableDiagnostics } from '../../utils/diagnostic-navigation';

function diag(file: string, line: number | null): Diagnostic {
  return {
    severity: 'error',
    file,
    line,
    column: null,
    message: 'm',
    raw: 'm',
    title: null,
    hint: null,
  };
}

test('navigableDiagnostics descarta sem linha e de arquivo desconhecido, na ordem do console', () => {
  const result = navigableDiagnostics(
    [diag('a.v', 2), diag('a.v', null), diag('outro.v', 9), diag('b.v', 7)],
    ['a.v', 'b.v'],
  );
  assert.deepEqual(
    result.map((d) => d.line),
    [7, 2],
  );
});

test('cycleIndex avanca e recua com retorno circular', () => {
  assert.equal(cycleIndex(null, 1, 3), 0);
  assert.equal(cycleIndex(null, -1, 3), 2);
  assert.equal(cycleIndex(2, 1, 3), 0);
  assert.equal(cycleIndex(0, -1, 3), 2);
  assert.equal(cycleIndex(1, 1, 3), 2);
});

test('cycleIndex sem itens devolve null', () => {
  assert.equal(cycleIndex(null, 1, 0), null);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic } from '@tplab/shared';
import { sortDiagnosticsByLineDesc } from '../../utils/sort-diagnostics';

function diag(line: number | null, message: string): Diagnostic {
  return {
    severity: 'error',
    file: 'd.v',
    line,
    column: null,
    message,
    raw: message,
    title: null,
    hint: null,
  };
}

test('ordena da maior linha para a menor', () => {
  const sorted = sortDiagnosticsByLineDesc([diag(2, 'a'), diag(10, 'b'), diag(5, 'c')]);
  assert.deepEqual(
    sorted.map((d) => d.line),
    [10, 5, 2],
  );
});

test('diagnosticos sem linha ficam no fim, na ordem original', () => {
  const sorted = sortDiagnosticsByLineDesc([diag(null, 'x'), diag(3, 'a'), diag(null, 'y')]);
  assert.deepEqual(
    sorted.map((d) => d.message),
    ['a', 'x', 'y'],
  );
});

test('empates mantem a ordem original e a entrada nao e alterada', () => {
  const input = [diag(4, 'a'), diag(4, 'b')];
  const sorted = sortDiagnosticsByLineDesc(input);
  assert.deepEqual(
    sorted.map((d) => d.message),
    ['a', 'b'],
  );
  assert.equal(input[0]?.message, 'a');
});

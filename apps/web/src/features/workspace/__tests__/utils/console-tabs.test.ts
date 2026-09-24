import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic, SimulationResult } from '@tplab/shared';
import { badgeTone, countDiagnostics, defaultConsoleTab } from '../../utils/console-tabs';

function diag(severity: Diagnostic['severity']): Diagnostic {
  return {
    severity,
    file: 'd.v',
    line: 1,
    column: null,
    message: 'm',
    raw: 'm',
    title: null,
    hint: null,
  };
}

function resultWith(diagnostics: Diagnostic[]): SimulationResult {
  return {
    jobId: 'job-1',
    status: 'succeeded',
    failure: null,
    diagnostics,
    stdout: '',
    stderr: '',
    vcd: null,
    durationMs: 10,
    finishedAt: null,
  };
}

test('countDiagnostics separa erros de avisos', () => {
  assert.deepEqual(countDiagnostics([diag('error'), diag('warning'), diag('warning')]), {
    errors: 1,
    warnings: 2,
  });
  assert.deepEqual(countDiagnostics([]), { errors: 0, warnings: 0 });
});

test('defaultConsoleTab abre Problemas quando há diagnósticos e Console nos demais casos', () => {
  assert.equal(defaultConsoleTab(null), 'console');
  assert.equal(defaultConsoleTab(resultWith([])), 'console');
  assert.equal(defaultConsoleTab(resultWith([diag('warning')])), 'problems');
  assert.equal(defaultConsoleTab(resultWith([diag('error')])), 'problems');
});

test('badgeTone: erro vence aviso e zero fica neutro', () => {
  assert.equal(badgeTone({ errors: 1, warnings: 3 }), 'error');
  assert.equal(badgeTone({ errors: 0, warnings: 3 }), 'warning');
  assert.equal(badgeTone({ errors: 0, warnings: 0 }), 'neutral');
});

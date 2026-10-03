import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic, SimulationResult } from '@tplab/shared';
import {
  describeLastRun,
  pickCompilerOutput,
  readRunContext,
  rememberRunContext,
  resetRunContext,
} from '../../utils/run-context';

function diagnostic(severity: Diagnostic['severity'], raw: string): Diagnostic {
  return {
    severity,
    file: 'somador4.v',
    line: 19,
    column: null,
    message: raw,
    raw,
    title: null,
    hint: null,
  };
}

function resultWith(overrides: Partial<SimulationResult> = {}): SimulationResult {
  return {
    jobId: 'job-1',
    status: 'succeeded',
    failure: null,
    diagnostics: [],
    stdout: '',
    stderr: '',
    vcd: null,
    durationMs: 410,
    finishedAt: null,
    queuePosition: null,
    truncated: { stdout: false, stderr: false, vcd: false },
    ...overrides,
  };
}

test('o contexto comeca vazio e guarda a ultima execucao', () => {
  resetRunContext();
  assert.deepEqual(readRunContext(), {
    projectId: null,
    projectName: null,
    lastRun: null,
    compilerOutput: null,
  });

  rememberRunContext({
    projectId: 'proj-1',
    projectName: 'somador4',
    lastRun: 'sem erros · 0,41 s',
    compilerOutput: null,
  });

  assert.equal(readRunContext().projectName, 'somador4');
  resetRunContext();
});

test('execucao bem-sucedida e descrita sem contagem de erros', () => {
  assert.equal(describeLastRun(resultWith()), 'sem erros · 0,41 s');
});

test('execucao com erro traz o desfecho, a contagem e a duracao', () => {
  const result = resultWith({
    failure: 'compile_error',
    durationMs: 120,
    diagnostics: [diagnostic('error', 'somador4.v:19: syntax error')],
  });

  assert.equal(describeLastRun(result), 'falhou · 1 erro · 0,12 s');
});

test('mais de um erro usa o plural', () => {
  const result = resultWith({
    failure: 'compile_error',
    diagnostics: [diagnostic('error', 'a'), diagnostic('error', 'b')],
  });

  assert.match(describeLastRun(result) ?? '', /2 erros/);
});

test('sem execucao nao ha o que descrever', () => {
  assert.equal(describeLastRun(null), null);
  assert.equal(pickCompilerOutput(null), null);
});

test('a saida do compilador e o primeiro erro, nao um aviso', () => {
  const result = resultWith({
    diagnostics: [diagnostic('warning', 'aviso qualquer'), diagnostic('error', 'erro de verdade')],
  });

  assert.equal(pickCompilerOutput(result), 'erro de verdade');
});

test('sem erro na lista, cai para a primeira linha util do stderr', () => {
  const result = resultWith({ stderr: '\n\n  primeira linha\nsegunda linha' });

  assert.equal(pickCompilerOutput(result), 'primeira linha');
});

test('saida muito longa e cortada — o relato nao carrega um log inteiro', () => {
  const result = resultWith({ stderr: 'x'.repeat(900) });

  const output = pickCompilerOutput(result) ?? '';
  assert.ok(output.length <= 401, `tamanho inesperado: ${output.length}`);
  assert.ok(output.endsWith('…'));
});

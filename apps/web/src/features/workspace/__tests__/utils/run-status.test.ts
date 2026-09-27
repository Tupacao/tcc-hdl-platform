import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic, HdlSources, SimulationResult } from '@tplab/shared';
import {
  announcementFor,
  buildRunStatus,
  formatCounts,
  formatDuration,
} from '../../utils/run-status';
import { changedFiles } from '../../utils/sources-equal';

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

function resultWith(
  diagnostics: Diagnostic[],
  failure: SimulationResult['failure'] = null,
  durationMs = 410,
): SimulationResult {
  return {
    jobId: 'job-1',
    status: failure ? 'failed' : 'succeeded',
    failure,
    diagnostics,
    stdout: '',
    stderr: '',
    vcd: null,
    durationMs,
    finishedAt: null,
  };
}

test('formatDuration usa vírgula decimal', () => {
  assert.equal(formatDuration(410), '0,41 s');
  assert.equal(formatDuration(2841), '2,84 s');
});

test('formatCounts concorda o plural', () => {
  assert.equal(formatCounts(0, 1), '0 erros · 1 aviso');
  assert.equal(formatCounts(1, 0), '1 erro · 0 avisos');
  assert.equal(formatCounts(2, 3), '2 erros · 3 avisos');
});

test('sem resultado a barra fica ociosa; executando mostra o andamento', () => {
  assert.equal(buildRunStatus({ result: null, error: null, isRunning: false }).kind, 'idle');
  assert.equal(buildRunStatus({ result: null, error: null, isRunning: true }).kind, 'running');
});

test('sucesso com aviso mostra desfecho, duração e contagem', () => {
  const status = buildRunStatus({
    result: resultWith([diag('warning')]),
    error: null,
    isRunning: false,
  });
  assert.equal(status.kind, 'success');
  assert.equal(status.label, 'Executado sem erros');
  assert.equal(status.duration, '0,41 s');
  assert.equal(status.counts, '0 erros · 1 aviso');
  assert.equal(status.detail, null);
});

test('erro de compilação informa que a simulação não rodou', () => {
  const status = buildRunStatus({
    result: resultWith([diag('error')], 'compile_error', 120),
    error: null,
    isRunning: false,
  });
  assert.equal(status.kind, 'failure');
  assert.equal(status.label, 'Falhou na compilação');
  assert.equal(status.counts, '1 erro · 0 avisos');
  assert.equal(status.detail, 'simulação não executada');
});

test('timeout e falha de requisição são falhas sem detalhe de compilação', () => {
  const timeout = buildRunStatus({
    result: resultWith([], 'timeout', 10000),
    error: null,
    isRunning: false,
  });
  assert.equal(timeout.label, 'Tempo limite excedido');
  assert.equal(timeout.detail, null);

  const request = buildRunStatus({ result: null, error: 'Muitas execuções', isRunning: false });
  assert.equal(request.kind, 'failure');
  assert.equal(request.label, 'Falha ao executar');
});

test('announcementFor junta as partes presentes em uma frase só', () => {
  const status = buildRunStatus({
    result: resultWith([diag('error')], 'compile_error', 120),
    error: null,
    isRunning: false,
  });
  assert.equal(
    announcementFor(status),
    'Falhou na compilação, 0,12 s, 1 erro · 0 avisos, simulação não executada',
  );
});

test('changedFiles marca só o arquivo que difere da versão salva', () => {
  const saved: HdlSources = {
    language: 'verilog',
    topModule: 'tb',
    design: { name: 'd.v', content: 'a' },
    testbench: { name: 'tb.v', content: 'b' },
  };
  assert.deepEqual(changedFiles(saved, saved), { design: false, testbench: false });
  assert.deepEqual(changedFiles({ ...saved, design: { name: 'd.v', content: 'x' } }, saved), {
    design: true,
    testbench: false,
  });
});

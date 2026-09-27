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
    queuePosition: null,
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

const IDLE_INPUT = {
  result: null,
  error: null,
  errorStatus: null,
  queued: false,
  queuePosition: null,
};

test('sem resultado a barra fica ociosa; executando mostra o andamento', () => {
  assert.equal(buildRunStatus({ ...IDLE_INPUT, isRunning: false }).kind, 'idle');
  assert.equal(buildRunStatus({ ...IDLE_INPUT, isRunning: true }).kind, 'running');
});

test('sucesso com aviso mostra desfecho, duração e contagem', () => {
  const status = buildRunStatus({
    ...IDLE_INPUT,
    result: resultWith([diag('warning')]),
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
    ...IDLE_INPUT,
    result: resultWith([diag('error')], 'compile_error', 120),
    isRunning: false,
  });
  assert.equal(status.kind, 'failure');
  assert.equal(status.label, 'Falhou na compilação');
  assert.equal(status.counts, '1 erro · 0 avisos');
  assert.equal(status.detail, 'simulação não executada');
});

test('timeout e falha de requisição são falhas sem detalhe de compilação', () => {
  const timeout = buildRunStatus({
    ...IDLE_INPUT,
    result: resultWith([], 'timeout', 10000),
    isRunning: false,
  });
  assert.equal(timeout.label, 'Tempo limite excedido');
  assert.equal(timeout.detail, null);

  const request = buildRunStatus({ ...IDLE_INPUT, error: 'Muitas execuções', isRunning: false });
  assert.equal(request.kind, 'failure');
  assert.equal(request.label, 'Falha ao executar');
});

test('RF03-I02: job na fila mostra a posição na barra de estado', () => {
  const withPosition = buildRunStatus({
    ...IDLE_INPUT,
    isRunning: true,
    queued: true,
    queuePosition: 3,
  });
  assert.equal(withPosition.kind, 'queued');
  assert.equal(withPosition.label, 'Na fila');
  assert.equal(withPosition.detail, 'posição 3');

  const withoutPosition = buildRunStatus({
    ...IDLE_INPUT,
    isRunning: true,
    queued: true,
    queuePosition: null,
  });
  assert.equal(withoutPosition.detail, 'aguardando um executor livre');
});

test('RF03-I02: 429 e 503 têm rótulos distintos de uma falha de rede genérica', () => {
  const rateLimited = buildRunStatus({
    ...IDLE_INPUT,
    isRunning: false,
    error: 'Muitas simulacoes em sequencia. Aguarde antes de tentar novamente.',
    errorStatus: 429,
  });
  assert.equal(rateLimited.label, 'Limite de uso atingido');
  assert.equal(
    rateLimited.detail,
    'Muitas simulacoes em sequencia. Aguarde antes de tentar novamente.',
  );

  const serviceUnavailable = buildRunStatus({
    ...IDLE_INPUT,
    isRunning: false,
    error: 'Fila de simulacoes cheia. Tente novamente em alguns minutos.',
    errorStatus: 503,
  });
  assert.equal(serviceUnavailable.label, 'Não foi possível executar');
  assert.equal(serviceUnavailable.detail, 'problema no servidor');

  const network = buildRunStatus({
    ...IDLE_INPUT,
    isRunning: false,
    error: 'Failed to fetch',
    errorStatus: null,
  });
  assert.equal(network.label, 'Falha ao executar');
});

test('RF03-I03: 404 de jobId expirado orienta a reexecutar', () => {
  const expired = buildRunStatus({
    ...IDLE_INPUT,
    isRunning: false,
    error: 'Simulacao nao encontrada ou expirada',
    errorStatus: 404,
  });
  assert.equal(expired.label, 'Simulação expirada');
  assert.equal(expired.detail, 'execute novamente');
});

test('announcementFor junta as partes presentes em uma frase só', () => {
  const status = buildRunStatus({
    ...IDLE_INPUT,
    result: resultWith([diag('error')], 'compile_error', 120),
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

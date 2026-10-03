import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Diagnostic } from '@tplab/shared';
import { analyzeLimitFailure, dropShellNoise, type LimitFailureInput } from './limits.js';

const base: LimitFailureInput = {
  failure: null,
  timeoutPhase: null,
  exitCode: 0,
  testbenchName: 'tb.v',
  timeoutMs: 10_000,
  compileTimeoutMs: 5_000,
  memoryMb: 128,
};

test('sem falha de limite nao gera diagnostico', () => {
  assert.deepEqual(analyzeLimitFailure(base), []);
  assert.deepEqual(analyzeLimitFailure({ ...base, failure: 'compile_error' }), []);
  assert.deepEqual(analyzeLimitFailure({ ...base, failure: 'runtime_error' }), []);
});

test('timeout da simulacao cita o limite e a causa provavel ($finish / laco sem #)', () => {
  const [diagnostic] = analyzeLimitFailure({
    ...base,
    failure: 'timeout',
    timeoutPhase: 'simulate',
  });
  assert.ok(diagnostic);
  assert.equal(diagnostic.severity, 'error');
  assert.equal(diagnostic.file, 'tb.v');
  assert.equal(diagnostic.line, null);
  assert.match(diagnostic.title ?? '', /simulação/);
  assert.match(diagnostic.message, /10 s/);
  assert.match(diagnostic.hint ?? '', /\$finish/);
});

test('timeout da compilacao e distinguivel do da simulacao', () => {
  const [diagnostic] = analyzeLimitFailure({
    ...base,
    failure: 'timeout',
    timeoutPhase: 'compile',
  });
  assert.ok(diagnostic);
  assert.match(diagnostic.title ?? '', /compilação/);
  assert.match(diagnostic.message, /5 s/);
  assert.match(diagnostic.hint ?? '', /include/);
});

test('timeout encerrado pelo host cai na mensagem da simulacao', () => {
  const [diagnostic] = analyzeLimitFailure({ ...base, failure: 'timeout', timeoutPhase: 'host' });
  assert.match(diagnostic?.title ?? '', /simulação/);
});

test('limite de memoria cita o valor configurado', () => {
  const [diagnostic] = analyzeLimitFailure({ ...base, failure: 'memory_limit', memoryMb: 64 });
  assert.match(diagnostic?.message ?? '', /64 MB/);
  assert.match(diagnostic?.hint ?? '', /mem/);
});

test('arquivo acima de 16 MB (exit 153) vira mensagem propria, nao um runtime_error generico', () => {
  const [diagnostic] = analyzeLimitFailure({ ...base, failure: 'runtime_error', exitCode: 153 });
  assert.match(diagnostic?.title ?? '', /Arquivo grande demais/);
  assert.match(diagnostic?.hint ?? '', /dumpvars/);
  // Outro runtime_error nao ganha essa mensagem.
  assert.deepEqual(analyzeLimitFailure({ ...base, failure: 'runtime_error', exitCode: 3 }), []);
});

test('logs indisponiveis tem mensagem propria, sem acusar o codigo', () => {
  const [diagnostic] = analyzeLimitFailure({
    ...base,
    failure: 'internal_error',
    logsUnavailable: true,
  });
  assert.match(diagnostic?.title ?? '', /Saída da execução indisponível/);
});

test('erro interno nao acusa o codigo do usuario', () => {
  const [diagnostic] = analyzeLimitFailure({ ...base, failure: 'internal_error' });
  assert.match(diagnostic?.message ?? '', /não vem do seu código/);
});

const killed: Diagnostic = {
  severity: 'error',
  file: 'tb.v',
  line: null,
  column: null,
  message: 'Killed',
  raw: 'Killed',
  title: null,
  hint: null,
};

test('dropShellNoise remove o "Killed" do shell so quando ha diagnostico de limite', () => {
  const limit = analyzeLimitFailure({ ...base, failure: 'timeout', timeoutPhase: 'simulate' });
  assert.deepEqual(dropShellNoise([killed], limit), []);
  assert.deepEqual(dropShellNoise([killed], []), [killed]);
  const fsize = { ...killed, raw: 'File size limit exceeded (core dumped)' };
  assert.deepEqual(dropShellNoise([fsize], limit), []);
});

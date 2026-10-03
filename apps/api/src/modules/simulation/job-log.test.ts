import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HdlSources } from '@tplab/shared';
import { buildJobLogRecord } from './job-log.js';
import type { SandboxOutcome } from './sandbox.js';

function sources(
  designBytes: number,
  testbenchBytes: number,
): Pick<HdlSources, 'design' | 'testbench'> {
  return {
    design: { name: 'd.v', content: 'a'.repeat(designBytes) },
    testbench: { name: 'tb.v', content: 'b'.repeat(testbenchBytes) },
  };
}

function outcome(overrides: Partial<SandboxOutcome> = {}): SandboxOutcome {
  return {
    exitCode: 0,
    failure: null,
    stdout: '',
    stderr: '',
    vcd: null,
    durationMs: 500,
    timings: { containerCreateMs: 100, executionMs: 300, artifactsReadMs: 50 },
    truncated: { stdout: false, stderr: false, vcd: false },
    oomKilled: false,
    timeoutPhase: null,
    logsUnavailable: false,
    ...overrides,
  };
}

test('buildJobLogRecord soma o tamanho de design + testbench, nunca o conteudo', () => {
  const record = buildJobLogRecord({
    jobId: '42',
    sources: sources(10, 20),
    outcome: outcome(),
    queuedAt: 1000,
    processedAt: 1200,
  });

  assert.equal(record.sourceBytes, 30);
  assert.ok(!('content' in record), 'o registro nunca deve carregar o codigo-fonte');
});

test('buildJobLogRecord usa o tamanho do .vcd truncado, ou 0 quando nao ha .vcd', () => {
  const withVcd = buildJobLogRecord({
    jobId: '1',
    sources: sources(1, 1),
    outcome: outcome({ vcd: 'x'.repeat(500) }),
    queuedAt: 0,
    processedAt: 0,
  });
  assert.equal(withVcd.vcdBytes, 500);

  const withoutVcd = buildJobLogRecord({
    jobId: '1',
    sources: sources(1, 1),
    outcome: outcome({ vcd: null }),
    queuedAt: 0,
    processedAt: 0,
  });
  assert.equal(withoutVcd.vcdBytes, 0);
});

test('buildJobLogRecord calcula o tempo de espera na fila a partir de queuedAt/processedAt', () => {
  const record = buildJobLogRecord({
    jobId: '1',
    sources: sources(1, 1),
    outcome: outcome(),
    queuedAt: 1_000,
    processedAt: 1_750,
  });
  assert.equal(record.queueWaitMs, 750);
});

test('buildJobLogRecord devolve queueWaitMs nulo quando o job ainda nao foi processado', () => {
  const record = buildJobLogRecord({
    jobId: '1',
    sources: sources(1, 1),
    outcome: outcome(),
    queuedAt: 1_000,
    processedAt: undefined,
  });
  assert.equal(record.queueWaitMs, null);
});

test('buildJobLogRecord repassa exitCode, failure e os tempos parciais do sandbox', () => {
  const record = buildJobLogRecord({
    jobId: '7',
    sources: sources(1, 1),
    outcome: outcome({
      exitCode: 124,
      failure: 'timeout',
      timings: { containerCreateMs: 40, executionMs: 10_000, artifactsReadMs: 5 },
    }),
    queuedAt: 0,
    processedAt: 0,
  });

  assert.equal(record.exitCode, 124);
  assert.equal(record.failure, 'timeout');
  assert.deepEqual(record.timings, {
    containerCreateMs: 40,
    executionMs: 10_000,
    artifactsReadMs: 5,
  });
});

test('buildJobLogRecord registra OOMKilled e a etapa do timeout (RNF05-I01)', () => {
  const record = buildJobLogRecord({
    jobId: '9',
    sources: sources(1, 1),
    outcome: outcome({ failure: 'memory_limit', oomKilled: true, timeoutPhase: 'host' }),
    queuedAt: 0,
    processedAt: 0,
  });
  assert.equal(record.oomKilled, true);
  assert.equal(record.timeoutPhase, 'host');
});

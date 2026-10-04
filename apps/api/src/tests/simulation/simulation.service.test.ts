import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DefaultSimulationService } from '../../application/simulation/service/simulation.service.js';
import { env } from '../../config/env.js';
import type {
  SimulationJobData,
  SimulationJobResult,
} from '../../domain/simulation/dtos/simulation-job.dto.js';
import {
  QueueFullError,
  QueueUnavailableError,
} from '../../domain/simulation/entities/simulation-error.js';
import type {
  SimulationJobRepository,
  SimulationJobSnapshot,
} from '../../domain/simulation/repositories/simulation-job.repository.js';

const REQUEST: SimulationJobData = {
  language: 'verilog',
  design: { name: 'dut.v', content: 'module dut; endmodule' },
  testbench: { name: 'tb.v', content: 'module tb; endmodule' },
  topModule: 'tb',
};

const CREATED_AT = new Date('2026-01-01T10:00:00.000Z');

/** Repositorio de jobs em memoria: o service nao sabe que a fila real e BullMQ. */
function fakeRepository(overrides: Partial<SimulationJobRepository> = {}): SimulationJobRepository {
  return {
    countWaiting: async () => 0,
    enqueue: async () => ({ id: 'job-1', createdAt: CREATED_AT }),
    findById: async () => null,
    waitingPosition: async () => null,
    ...overrides,
  };
}

function snapshot(overrides: Partial<SimulationJobSnapshot> = {}): SimulationJobSnapshot {
  return {
    id: 'job-1',
    status: 'queued',
    createdAt: CREATED_AT,
    finishedAt: null,
    result: null,
    failedReason: null,
    ...overrides,
  };
}

test('enqueue devolve o job com status queued e a data da fila', async () => {
  const service = new DefaultSimulationService(fakeRepository());

  assert.deepEqual(await service.enqueue(REQUEST), {
    jobId: 'job-1',
    status: 'queued',
    createdAt: CREATED_AT.toISOString(),
  });
});

test('fila acima do teto recusa com QueueFullError, sem enfileirar (RF03-I02)', async () => {
  let enqueued = 0;
  const service = new DefaultSimulationService(
    fakeRepository({
      countWaiting: async () => env.SIMULATION_MAX_QUEUE_DEPTH,
      enqueue: async () => {
        enqueued += 1;
        return { id: 'job-1', createdAt: CREATED_AT };
      },
    }),
  );

  await assert.rejects(() => service.enqueue(REQUEST), QueueFullError);
  assert.equal(enqueued, 0);
});

test('fila inalcancavel (Redis fora do ar) vira QueueUnavailableError', async () => {
  const cause = new Error('connect ECONNREFUSED');
  const service = new DefaultSimulationService(
    fakeRepository({
      countWaiting: async () => {
        throw cause;
      },
    }),
  );

  await assert.rejects(
    () => service.enqueue(REQUEST),
    (error: unknown) => {
      assert.ok(error instanceof QueueUnavailableError);
      assert.equal(error.cause, cause);
      return true;
    },
  );
});

test('job inexistente ou expirado devolve null (o controller responde 404)', async () => {
  const service = new DefaultSimulationService(fakeRepository());

  assert.equal(await service.findResult('nao-existe'), null);
});

test('job na fila devolve resultado parcial com a posicao na espera', async () => {
  const service = new DefaultSimulationService(
    fakeRepository({ findById: async () => snapshot(), waitingPosition: async () => 3 }),
  );

  const result = await service.findResult('job-1');
  assert.equal(result?.status, 'queued');
  assert.equal(result?.queuePosition, 3);
  assert.equal(result?.failure, null);
  assert.deepEqual(result?.diagnostics, []);
  assert.equal(result?.finishedAt, null);
});

test('job em execucao nao consulta posicao na fila', async () => {
  let consulted = false;
  const service = new DefaultSimulationService(
    fakeRepository({
      findById: async () => snapshot({ status: 'running' }),
      waitingPosition: async () => {
        consulted = true;
        return 1;
      },
    }),
  );

  const result = await service.findResult('job-1');
  assert.equal(result?.status, 'running');
  assert.equal(result?.queuePosition, null);
  assert.equal(consulted, false);
});

test('job concluido devolve o resultado do worker com jobId e status', async () => {
  const workerResult = {
    failure: null,
    diagnostics: [],
    stdout: 'b=1',
    stderr: '',
    vcd: '$var wire 1 ! b $end',
    durationMs: 1234,
    finishedAt: '2026-01-01T10:00:05.000Z',
    queuePosition: null,
    truncated: { stdout: false, stderr: false, vcd: false },
  } satisfies SimulationJobResult;
  const service = new DefaultSimulationService(
    fakeRepository({
      findById: async () => snapshot({ status: 'succeeded', result: workerResult }),
    }),
  );

  assert.deepEqual(await service.findResult('job-1'), {
    ...workerResult,
    jobId: 'job-1',
    status: 'succeeded',
  });
});

test('job que falhou sem resultado vira internal_error com o motivo da fila', async () => {
  const finishedAt = new Date('2026-01-01T10:00:09.000Z');
  const service = new DefaultSimulationService(
    fakeRepository({
      findById: async () =>
        snapshot({ status: 'failed', failedReason: 'worker morreu', finishedAt }),
    }),
  );

  const result = await service.findResult('job-1');
  assert.equal(result?.status, 'failed');
  assert.equal(result?.failure, 'internal_error');
  assert.equal(result?.stderr, 'worker morreu');
  assert.equal(result?.finishedAt, finishedAt.toISOString());
});

test('falha sem motivo registrado cai na mensagem padrao em portugues', async () => {
  const service = new DefaultSimulationService(
    fakeRepository({ findById: async () => snapshot({ status: 'failed' }) }),
  );

  const result = await service.findResult('job-1');
  assert.match(result?.stderr ?? '', /falhou antes de produzir resultado/);
});

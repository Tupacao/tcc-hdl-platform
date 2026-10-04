import type { CompileRequest, SimulationJob, SimulationResult } from '@tplab/shared';
import { env } from '../../../config/env.js';
import {
  QueueFullError,
  QueueUnavailableError,
} from '../../../domain/simulation/entities/simulation-error.js';
import type { SimulationJobSnapshot } from '../../../domain/simulation/repositories/simulation-job.repository.js';
import type { SimulationJobRepository } from '../../../domain/simulation/repositories/simulation-job.repository.js';
import type { SimulationService } from '../../../domain/simulation/services/simulation.service.js';

/**
 * RF03/RF04 do lado da API: decide se a submissao entra na fila e monta o
 * resultado servido no polling. Nao conhece HTTP (quem traduz as falhas em
 * status e o controller) nem BullMQ (quem fala com a fila e o repositorio).
 */
export class DefaultSimulationService implements SimulationService {
  constructor(private readonly jobs: SimulationJobRepository) {}

  async enqueue(request: CompileRequest): Promise<SimulationJob> {
    let job: { id: string; createdAt: Date };
    try {
      // RF03-I02: fila cheia e recusa temporaria, nao erro de infraestrutura.
      if ((await this.jobs.countWaiting()) >= env.SIMULATION_MAX_QUEUE_DEPTH) {
        throw new QueueFullError();
      }
      job = await this.jobs.enqueue(request);
    } catch (cause) {
      if (cause instanceof QueueFullError) throw cause;
      // Sem Redis a fila nao aceita jobs — nada foi enfileirado.
      throw new QueueUnavailableError(cause);
    }

    return {
      jobId: job.id,
      status: 'queued',
      createdAt: job.createdAt.toISOString(),
    };
  }

  async findResult(jobId: string): Promise<SimulationResult | null> {
    const job = await this.jobs.findById(jobId);
    if (!job) return null;

    if (job.result) {
      return { ...job.result, jobId: job.id, status: job.status };
    }

    const pending = await this.pendingResult(job);
    if (job.status !== 'failed') return pending;

    // Job que morreu antes de produzir resultado (o worker caiu, o job foi
    // descartado): o motivo bruto da fila e o que ha para mostrar.
    return {
      ...pending,
      failure: 'internal_error',
      stderr:
        job.failedReason ??
        'A execução falhou antes de produzir resultado. Execute novamente; se repetir, avise quem mantém a plataforma.',
      finishedAt: job.finishedAt?.toISOString() ?? null,
    };
  }

  /** Resultado vazio de um job que ainda nao terminou — so `status` e a posicao na fila. */
  private async pendingResult(job: SimulationJobSnapshot): Promise<SimulationResult> {
    return {
      jobId: job.id,
      status: job.status,
      failure: null,
      diagnostics: [],
      stdout: '',
      stderr: '',
      vcd: null,
      durationMs: 0,
      finishedAt: null,
      queuePosition: job.status === 'queued' ? await this.jobs.waitingPosition(job.id) : null,
      truncated: { stdout: false, stderr: false, vcd: false },
    };
  }
}

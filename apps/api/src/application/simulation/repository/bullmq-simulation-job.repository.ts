import type { JobStatus } from '@tplab/shared';
import type { SimulationJobData } from '../../../domain/simulation/dtos/simulation-job.dto.js';
import type {
  SimulationJobRepository,
  SimulationJobSnapshot,
} from '../../../domain/simulation/repositories/simulation-job.repository.js';
import type { SimulationQueue } from '../../../infra/queue/simulation.queue.js';

/** Estados internos do BullMQ mapeados para o contrato publico da API. */
export function toJobStatus(state: string): JobStatus {
  switch (state) {
    case 'completed':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'active':
      return 'running';
    default:
      return 'queued';
  }
}

/**
 * Jobs de simulacao na fila BullMQ/Redis (RF03). Unico ponto do codigo que
 * conhece BullMQ do lado da API: acima daqui o job e um registro com `status`
 * do contrato publico.
 *
 * A fila entra por injecao (`app.ts`): instanciar o `Queue` e abrir conexao com o
 * Redis, e importar um modulo nao pode ter esse efeito — um teste que so precise de
 * `toJobStatus` ficaria com o processo preso numa conexao que ninguem fecha.
 */
export class BullMqSimulationJobRepository implements SimulationJobRepository {
  constructor(private readonly queue: SimulationQueue) {}

  async countWaiting(): Promise<number> {
    return this.queue.getWaitingCount();
  }

  async enqueue(data: SimulationJobData): Promise<{ id: string; createdAt: Date }> {
    const job = await this.queue.add('simulate', data);
    return { id: String(job.id), createdAt: new Date(job.timestamp) };
  }

  async findById(jobId: string): Promise<SimulationJobSnapshot | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    const status = toJobStatus(await job.getState());
    return {
      id: String(job.id),
      status,
      createdAt: new Date(job.timestamp),
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      // `returnvalue` so existe quando o worker concluiu com sucesso.
      result: status === 'succeeded' ? (job.returnvalue ?? null) : null,
      failedReason: job.failedReason ?? null,
    };
  }

  async waitingPosition(jobId: string): Promise<number | null> {
    const waiting = await this.queue.getJobs(['waiting'], 0, -1);
    const index = waiting.findIndex((waitingJob) => String(waitingJob.id) === jobId);
    return index === -1 ? null : index + 1;
  }
}

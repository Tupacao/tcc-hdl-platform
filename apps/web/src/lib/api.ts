import {
  FeedbackReceiptSchema,
  SimulationJobSchema,
  SimulationResultSchema,
  type CompileRequest,
  type CreateFeedback,
  type FeedbackReceipt,
  type SimulationJob,
  type SimulationResult,
} from '@tplab/shared';
import type { ZodType } from 'zod';
import { markPerf, measurePerf, startRunPerf } from './perf';

/** Vazio em desenvolvimento: o proxy do Vite repassa /api para a API. */
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(path: string, schema: ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `Falha na requisição (HTTP ${response.status})`;
    throw new ApiRequestError(message, response.status);
  }

  // Valida a resposta com o mesmo schema usado pela API (packages/shared).
  return schema.parse(payload);
}

export function startSimulation(body: CompileRequest): Promise<SimulationJob> {
  return request('/api/simulations', SimulationJobSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Envia um relato (RF17). O `429` do limite diario chega como `ApiRequestError`
 * com `status` 429 e a mensagem do servidor — o diálogo distingue os dois casos.
 */
export function sendFeedback(body: CreateFeedback): Promise<FeedbackReceipt> {
  return request('/api/feedback', FeedbackReceiptSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getSimulation(jobId: string): Promise<SimulationResult> {
  return request(`/api/simulations/${jobId}`, SimulationResultSchema);
}

const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 60_000;

/**
 * Enfileira a simulação e acompanha o job até o desfecho. O polling é simples de
 * propósito; se a latência incomodar, trocar por SSE/WebSocket sem mudar a API.
 * `onPoll` recebe cada resultado intermediário (ex.: `queuePosition` enquanto
 * `status` é `queued`, RF03-I02) — o retorno da função só chega no desfecho final.
 */
export async function runSimulation(
  body: CompileRequest,
  signal?: AbortSignal,
  onPoll?: (result: SimulationResult) => void,
): Promise<SimulationResult> {
  startRunPerf();
  const job = await startSimulation(body);
  markPerf('enqueued');
  measurePerf('enqueue', 'run-start', 'enqueued');
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    const result = await getSimulation(job.jobId);
    onPoll?.(result);
    if (result.status === 'succeeded' || result.status === 'failed') {
      markPerf('result');
      measurePerf('wait', 'enqueued', 'result');
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new ApiRequestError('Tempo limite excedido aguardando a simulação', 504);
}

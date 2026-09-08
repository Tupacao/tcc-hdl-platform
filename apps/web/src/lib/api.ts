import {
  SimulationJobSchema,
  SimulationResultSchema,
  type CompileRequest,
  type SimulationJob,
  type SimulationResult,
} from '@tplab/shared';
import type { ZodType } from 'zod';

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
        : `Falha na requisicao (HTTP ${response.status})`;
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

export function getSimulation(jobId: string): Promise<SimulationResult> {
  return request(`/api/simulations/${jobId}`, SimulationResultSchema);
}

const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 60_000;

/**
 * Enfileira a simulacao e acompanha o job ate o desfecho. O polling e simples de
 * proposito; se a latencia incomodar, trocar por SSE/WebSocket sem mudar a API.
 */
export async function runSimulation(
  body: CompileRequest,
  signal?: AbortSignal,
): Promise<SimulationResult> {
  const job = await startSimulation(body);
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    const result = await getSimulation(job.jobId);
    if (result.status === 'succeeded' || result.status === 'failed') return result;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new ApiRequestError('Tempo limite excedido aguardando a simulacao', 504);
}

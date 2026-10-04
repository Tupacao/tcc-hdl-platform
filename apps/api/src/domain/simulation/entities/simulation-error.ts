/**
 * Falhas de enfileiramento que o controller precisa distinguir para escolher o
 * status HTTP. Sao erros de dominio, nao de transporte: o service nao conhece
 * Fastify, e o controller nao conhece BullMQ nem Redis.
 */

/** Fila acima de `SIMULATION_MAX_QUEUE_DEPTH` (RF03-I02) — recusa temporaria, com fila viva. */
export class QueueFullError extends Error {
  constructor() {
    super('Fila de simulações cheia');
    this.name = 'QueueFullError';
  }
}

/** A fila nao pode ser alcancada (Redis fora do ar) — nada foi enfileirado. */
export class QueueUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Serviço de simulação indisponível', { cause });
    this.name = 'QueueUnavailableError';
  }
}

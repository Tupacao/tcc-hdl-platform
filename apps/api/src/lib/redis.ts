import { Redis } from 'ioredis';
import { env } from '../config/env.js';

/**
 * Conexao compartilhada com o Redis. `lazyConnect` evita derrubar a API quando o
 * Redis ainda nao subiu — a falha aparece somente ao enfileirar um job.
 * `maxRetriesPerRequest: null` e exigido pelo BullMQ.
 */
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: true,
  });
}

import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Instancia pino compartilhada entre a API (via `loggerInstance` do Fastify)
 * e o worker (RF03-I04) — mesmo padrao de log estruturado nos dois processos,
 * que hoje rodam separados e sem correlacao nenhuma entre si.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
});

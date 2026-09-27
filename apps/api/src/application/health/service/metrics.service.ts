import type { Redis } from 'ioredis';
import type {
  MetricsService,
  WorkerMetrics,
} from '../../../domain/health/services/metrics.service.js';
import { readWorkerMetrics } from '../../../lib/metrics.js';

export class RedisMetricsService implements MetricsService {
  constructor(private readonly redis: Redis) {}

  getMetrics(): Promise<WorkerMetrics> {
    return readWorkerMetrics(this.redis);
  }
}

import type {
  HealthService,
  HealthStatus,
} from '../../../domain/health/services/health.service.js';

export class DefaultHealthService implements HealthService {
  check(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }
}

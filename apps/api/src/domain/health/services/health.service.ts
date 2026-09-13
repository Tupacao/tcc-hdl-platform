/** Resposta de `/health` — status do processo da API, sem dependencia externa. */
export interface HealthStatus {
  status: 'ok';
  uptime: number;
  version: string;
}

export interface HealthService {
  check(): HealthStatus;
}

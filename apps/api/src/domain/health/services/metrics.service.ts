/**
 * Snapshot dos contadores do worker (RF03-I04). Sustenta a afirmacao de
 * desempenho de RNF07 ("menos de cinco segundos") com numeros reais, em vez
 * de amostras isoladas — e ajuda a dimensionar os limites de RF03-I02/I03.
 */
export interface WorkerMetrics {
  totalJobs: number;
  succeededJobs: number;
  failedJobs: number;
  /** Contagem por tipo de falha (`compile_error`, `timeout`, ...). */
  failuresByType: Record<string, number>;
  /** `null` quando nenhum job foi processado ainda. */
  averageDurationMs: number | null;
}

export interface MetricsService {
  getMetrics(): Promise<WorkerMetrics>;
}

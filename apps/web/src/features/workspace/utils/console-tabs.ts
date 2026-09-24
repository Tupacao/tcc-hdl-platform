import type { Diagnostic, SimulationResult } from '@tplab/shared';

export type ConsoleTab = 'console' | 'problems';

export interface DiagnosticCounts {
  errors: number;
  warnings: number;
}

export function countDiagnostics(diagnostics: readonly Diagnostic[]): DiagnosticCounts {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  return { errors, warnings: diagnostics.length - errors };
}

/**
 * Aba exibida depois de uma execução (Figma 2.3 e 4.1): com erros ou avisos, a
 * lista de Problemas; sem nenhum, a saída bruta no Console.
 */
export function defaultConsoleTab(result: SimulationResult | null): ConsoleTab {
  return result !== null && result.diagnostics.length > 0 ? 'problems' : 'console';
}

/** Tom do selo de contagem: erro vence aviso; zero fica neutro. */
export function badgeTone(counts: DiagnosticCounts): 'error' | 'warning' | 'neutral' {
  if (counts.errors > 0) return 'error';
  if (counts.warnings > 0) return 'warning';
  return 'neutral';
}

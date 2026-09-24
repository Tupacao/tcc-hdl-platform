import type { Diagnostic } from '@tplab/shared';
import { sortDiagnosticsByLineDesc } from './sort-diagnostics';

/** Diagnósticos alcançáveis por teclado, na mesma ordem exibida no console (RF09-I02). */
export function navigableDiagnostics(
  diagnostics: Diagnostic[],
  knownFileNames: string[],
): Diagnostic[] {
  return sortDiagnosticsByLineDesc(diagnostics).filter(
    (diagnostic) => diagnostic.line !== null && knownFileNames.includes(diagnostic.file),
  );
}

/**
 * Próximo índice circular. Sem seleção anterior (`current === null`), o primeiro
 * avanço vai ao primeiro item e o retrocesso ao último.
 */
export function cycleIndex(current: number | null, delta: 1 | -1, length: number): number | null {
  if (length === 0) return null;
  if (current === null) return delta === 1 ? 0 : length - 1;
  return (current + delta + length) % length;
}

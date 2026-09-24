import type { Diagnostic } from '@tplab/shared';

/**
 * Ordena os diagnósticos pela linha, da maior para a menor (RF05).
 * Os que não apontam para uma linha ficam no fim; empates mantêm a ordem original.
 */
export function sortDiagnosticsByLineDesc(diagnostics: Diagnostic[]): Diagnostic[] {
  return diagnostics
    .map((diagnostic, index) => ({ diagnostic, index }))
    .sort((a, b) => {
      const lineA = a.diagnostic.line;
      const lineB = b.diagnostic.line;
      if (lineA === null && lineB === null) return a.index - b.index;
      if (lineA === null) return 1;
      if (lineB === null) return -1;
      return lineB - lineA || a.index - b.index;
    })
    .map(({ diagnostic }) => diagnostic);
}

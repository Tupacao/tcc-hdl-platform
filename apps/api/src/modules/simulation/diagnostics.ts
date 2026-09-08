import type { Diagnostic } from '@hdl/shared';

/**
 * Formatos emitidos pelo Icarus Verilog:
 *   design.v:12: syntax error
 *   design.v:12: error: Unknown module type: fulladder
 *   tb.v:3:7: warning: Port 1 of ... is not connected
 *   tb.v:9: sorry: Constructs not supported
 */
const ICARUS_LINE = /^(?<file>[^\s:]+):(?<line>\d+)(?::(?<column>\d+))?:\s*(?<rest>.*)$/;
const SEVERITY_PREFIX = /^(?<kind>error|warning|sorry|internal error)\s*:\s*(?<message>.*)$/i;

function toSeverity(kind: string | undefined, rest: string): Diagnostic['severity'] {
  if (kind && kind.toLowerCase() === 'warning') return 'warning';
  if (kind) return 'error';
  // Sem prefixo explicito o Icarus usa "syntax error", "Unknown module type", etc.
  return /warning/i.test(rest) ? 'warning' : 'error';
}

/**
 * Converte a saida bruta do `iverilog`/`vvp` em diagnosticos com numero de linha,
 * para que o editor consiga destacar a posicao do erro (RF05).
 */
export function parseIcarusDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const raw of output.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;

    const match = ICARUS_LINE.exec(trimmed);
    if (!match?.groups) {
      // Linhas sem localizacao ainda importam (ex.: "2 error(s) during elaboration").
      diagnostics.push({
        severity: /warning/i.test(trimmed) ? 'warning' : 'error',
        file: '',
        line: null,
        column: null,
        message: trimmed,
        raw,
      });
      continue;
    }

    const { file, line, column, rest } = match.groups as {
      file: string;
      line: string;
      column?: string;
      rest: string;
    };

    const severityMatch = SEVERITY_PREFIX.exec(rest);
    const message = severityMatch?.groups?.message ?? rest;

    diagnostics.push({
      severity: toSeverity(severityMatch?.groups?.kind, rest),
      file,
      line: Number.parseInt(line, 10),
      column: column ? Number.parseInt(column, 10) : null,
      message: message.trim(),
      raw,
    });
  }

  return diagnostics;
}

export function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

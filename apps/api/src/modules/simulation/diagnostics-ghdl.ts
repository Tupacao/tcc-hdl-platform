import type { Diagnostic } from '@tplab/shared';

/**
 * Formatos emitidos pelo GHDL (capturados rodando o sandbox `tplab-sandbox-ghdl`):
 *   /work/counter.vhd:4:102: no declaration for "x"
 *   /work/counter.vhd:4:5:warning: signal "s" is never read
 *   /work/tb.vhd:6:74:@112ns:(assertion error): mensagem do assert
 *   /work/tb.vhd:6:74:@112ns:(report note): q=10
 *   ghdl: cannot find entity "foo"
 *
 * Diferente do Icarus, o erro de analise nao traz prefixo `error:`; o aviso traz `warning:`
 * colado na coluna. Depois de cada erro o GHDL ecoa a linha do fonte e um `^` indentados —
 * ruido que o console nao precisa.
 */
const GHDL_LINE =
  /^(?<file>[^\s:]+):(?<line>\d+):(?<column>\d+):(?:@(?<time>[^:]+):\((?<tag>[^)]+)\):|\s*(?<kind>warning|error):)?\s*(?<message>.*)$/;
const GHDL_TOOL_LINE = /^ghdl:\s*(?:(?<kind>error|warning):\s*)?(?<message>.*)$/;
/** Resumos que repetem o que os diagnosticos ja dizem. */
const SUMMARY = /^(compilation error|error during elaboration|simulation finished @.*)$/i;

function normalizeFileName(rawFile: string, knownFileNames: readonly string[]): string {
  const lastSegment = rawFile.split('/').pop() ?? rawFile;
  return knownFileNames.includes(lastSegment) ? lastSegment : rawFile;
}

/** `report`/`assert` em tempo de simulacao: nota nao e diagnostico; falha e erro; o resto aviso. */
function severityOfRuntimeTag(tag: string): Diagnostic['severity'] | null {
  if (/note/i.test(tag)) return null;
  if (/error|failure/i.test(tag)) return 'error';
  return 'warning';
}

/** Converte o stderr do `ghdl` em diagnosticos com arquivo e linha (RF05), como o parser do Icarus. */
export function parseGhdlDiagnostics(
  output: string,
  knownFileNames: readonly string[] = [],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const raw of output.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed.length === 0 || SUMMARY.test(trimmed)) continue;
    // Eco da linha de codigo e o `^` abaixo dela.
    if (/^\s/.test(raw)) continue;

    const match = GHDL_LINE.exec(trimmed);
    if (match?.groups) {
      const { file, line, column, tag, kind, message } = match.groups as {
        file: string;
        line: string;
        column: string;
        tag?: string;
        kind?: string;
        message: string;
      };
      const severity = tag
        ? severityOfRuntimeTag(tag)
        : kind?.toLowerCase() === 'warning'
          ? 'warning'
          : 'error';
      if (severity === null) continue;
      diagnostics.push({
        severity,
        file: normalizeFileName(file, knownFileNames),
        line: Number.parseInt(line, 10),
        column: Number.parseInt(column, 10),
        message: message.trim(),
        raw,
        title: null,
        hint: null,
      });
      continue;
    }

    const tool = GHDL_TOOL_LINE.exec(trimmed);
    if (tool?.groups) {
      diagnostics.push({
        severity: tool.groups.kind === 'warning' ? 'warning' : 'error',
        file: '',
        line: null,
        column: null,
        message: (tool.groups.message ?? '').trim(),
        raw,
        title: null,
        hint: null,
      });
      continue;
    }

    // Linha sem formato conhecido: nunca descartar em silencio (mesmo criterio do Icarus).
    diagnostics.push({
      severity: 'error',
      file: '',
      line: null,
      column: null,
      message: trimmed,
      raw,
      title: null,
      hint: null,
    });
  }

  return diagnostics;
}

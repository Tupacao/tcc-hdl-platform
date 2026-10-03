import type { Diagnostic } from '@tplab/shared';

/**
 * Formatos emitidos pelo Icarus Verilog:
 *   design.v:12: syntax error
 *   design.v:12: error: Unknown module type: fulladder
 *   tb.v:3:7: warning: Port 1 of ... is not connected
 *
 * `run-simulation.sh` roda `iverilog`/`vvp` com caminho absoluto (`/work/...`) -
 * o `file` capturado aqui ainda carrega esse prefixo; `normalizeFileName` remove.
 */
const ICARUS_LINE = /^(?<file>[^\s:]+):(?<line>\d+)(?::(?<column>\d+))?:\s*(?<rest>.*)$/;
const SEVERITY_PREFIX = /^(?<kind>error|warning|sorry|internal error)\s*:\s*(?<message>.*)$/i;

/**
 * `$fatal` do testbench (RF04-I01) não usa o formato `file:line:` no início da
 * linha - vem prefixado por `FATAL:`. Capturado rodando de propósito contra o
 * sandbox real (`tplab-sandbox:latest`), não um formato hipotético.
 */
const VVP_FATAL = /^FATAL:\s*(?<file>[^\s:]+):(?<line>\d+):\s*(?<message>.*)$/;

/** "N error(s) during elaboration." - contagem, não um erro em si (RF05-I01). */
const ELABORATION_SUMMARY = /^\d+ error\(s\) during elaboration\.?$/i;

function toSeverity(kind: string | undefined, rest: string): Diagnostic['severity'] {
  if (kind && kind.toLowerCase() === 'warning') return 'warning';
  if (kind) return 'error';
  // Sem prefixo explicito o Icarus usa "syntax error", "Unknown module type", etc.
  return /warning/i.test(rest) ? 'warning' : 'error';
}

/**
 * Remove o prefixo de diretório (`/work/`, `./`) do caminho emitido pela
 * toolchain e troca pelo nome exatamente como o usuário submeteu. Quando o
 * nome resultante não bate com nenhum arquivo conhecido, mantém o valor
 * original em vez de arriscar um caminho errado - a normalização nunca deve
 * inventar um nome.
 */
function normalizeFileName(rawFile: string, knownFileNames: readonly string[]): string {
  if (rawFile.length === 0) return rawFile;
  const lastSegment = rawFile.split('/').pop() ?? rawFile;
  return knownFileNames.includes(lastSegment) ? lastSegment : rawFile;
}

/**
 * Converte a saida bruta do `iverilog`/`vvp` em diagnosticos com numero de linha,
 * para que o editor consiga destacar a posicao do erro (RF05). `knownFileNames`
 * (os nomes submetidos, ex.: `full_adder.v`) permite normalizar o caminho
 * absoluto do container de volta ao nome que o frontend reconhece.
 */
export function parseIcarusDiagnostics(
  output: string,
  knownFileNames: readonly string[] = [],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  // "*** These modules were missing:\n        foo referenced 1 times.\n***" -
  // bloco decorativo que acompanha "Unknown module type" (o erro de verdade ja
  // virou seu proprio diagnostico); as duas linhas "***" delimitam o bloco.
  let insideModuleListBanner = false;

  function appendToPrevious(detail: string): boolean {
    const previous = diagnostics[diagnostics.length - 1];
    if (!previous) return false;
    previous.message = `${previous.message} - ${detail}`;
    return true;
  }

  for (const raw of output.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;

    if (trimmed.startsWith('***')) {
      insideModuleListBanner = !insideModuleListBanner;
      continue;
    }
    if (insideModuleListBanner) continue;

    if (ELABORATION_SUMMARY.test(trimmed)) continue;

    const icarusMatch = ICARUS_LINE.exec(trimmed);
    if (icarusMatch?.groups) {
      const { file, line, column, rest } = icarusMatch.groups as {
        file: string;
        line: string;
        column?: string;
        rest: string;
      };

      // "tb.v:4:        : Padding 4 high bits of the port." - continuacao de um
      // diagnostico multi-linha (ex.: aviso de largura de porta), nao um novo
      // diagnostico: sem coluna numerica e o "resto" comeca com dois-pontos.
      if (column === undefined && rest.startsWith(':')) {
        if (appendToPrevious(rest.replace(/^:\s*/, ''))) continue;
        // Sem diagnostico anterior para anexar - cai para o tratamento comum
        // abaixo em vez de perder a linha em silencio.
      }

      const severityMatch = SEVERITY_PREFIX.exec(rest);
      const message = (severityMatch?.groups?.message ?? rest).trim();

      diagnostics.push({
        severity: toSeverity(severityMatch?.groups?.kind, rest),
        file: normalizeFileName(file, knownFileNames),
        line: Number.parseInt(line, 10),
        column: column ? Number.parseInt(column, 10) : null,
        message,
        raw,
        title: null,
        hint: null,
      });
      continue;
    }

    const vvpFatalMatch = VVP_FATAL.exec(trimmed);
    if (vvpFatalMatch?.groups) {
      const { file, line, message } = vvpFatalMatch.groups as {
        file: string;
        line: string;
        message: string;
      };
      diagnostics.push({
        severity: 'error',
        file: normalizeFileName(file, knownFileNames),
        line: Number.parseInt(line, 10),
        column: null,
        message: message.trim(),
        raw,
        title: null,
        hint: null,
      });
      continue;
    }

    // "       Time: 1  Scope: tb" - continuacao indentada sem prefixo
    // "arquivo:linha" nenhum (formato do $fatal), grudada no diagnostico anterior.
    if (/^\s/.test(raw) && appendToPrevious(trimmed)) continue;

    // Linha sem localizacao reconhecida ainda importa (ex.: "2 error(s) during
    // elaboration" de formatos nao cobertos, ou "I give up." do iverilog) -
    // nunca descartar em silencio.
    diagnostics.push({
      severity: /warning/i.test(trimmed) ? 'warning' : 'error',
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

export function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

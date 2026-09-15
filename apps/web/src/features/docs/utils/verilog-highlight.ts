/**
 * Destacador de sintaxe Verilog para os blocos de código da documentação
 * (RF11) - regex de passagem única, sem dependência nova (Monaco pesaria
 * demais para blocos curtos e só leitura, decisão registrada no RF11-I01).
 * Cores e categorias vêm de `docs/design-system-fundamentos.md` §8.
 */

export type VerilogTokenType =
  | 'keyword'
  | 'type'
  | 'directive'
  | 'number'
  | 'string'
  | 'comment'
  | 'operator'
  | 'plain';

export interface VerilogToken {
  text: string;
  type: VerilogTokenType;
}

/** Estruturais - "module, assign, always" (design-system-fundamentos.md §8). */
const KEYWORDS = new Set([
  'module',
  'endmodule',
  'function',
  'endfunction',
  'task',
  'endtask',
  'assign',
  'always',
  'initial',
  'begin',
  'end',
  'if',
  'else',
  'case',
  'endcase',
  'default',
  'for',
  'parameter',
]);

/** Tipo e porta - "wire, reg, input, output" (design-system-fundamentos.md §8). */
const TYPES = new Set(['wire', 'reg', 'input', 'output', 'inout', 'integer']);

const TOKEN_PATTERN =
  /(?<comment>\/\/[^\n]*)|(?<blockComment>\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*")|(?<directive>[$`][a-zA-Z_]\w*)|(?<number>\d+'[sS]?[bBoOdDhH][0-9a-fA-FxXzZ_]+|\b\d+\b)|(?<word>[a-zA-Z_]\w*)|(?<op>[{}[\]().,;:#@]|[&|^~!+\-*/%<>=?]+)/g;

export function tokenizeVerilog(code: string): VerilogToken[] {
  const tokens: VerilogToken[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(TOKEN_PATTERN)) {
    const index = match.index;
    if (index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, index), type: 'plain' });
    }

    const groups = match.groups ?? {};
    if (groups.comment || groups.blockComment) {
      tokens.push({ text: match[0], type: 'comment' });
    } else if (groups.string) {
      tokens.push({ text: match[0], type: 'string' });
    } else if (groups.directive) {
      tokens.push({ text: match[0], type: 'directive' });
    } else if (groups.number) {
      tokens.push({ text: match[0], type: 'number' });
    } else if (groups.word) {
      const word = groups.word;
      if (KEYWORDS.has(word)) tokens.push({ text: match[0], type: 'keyword' });
      else if (TYPES.has(word)) tokens.push({ text: match[0], type: 'type' });
      else tokens.push({ text: match[0], type: 'plain' });
    } else if (groups.op) {
      tokens.push({ text: match[0], type: 'operator' });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'plain' });
  }

  return tokens;
}

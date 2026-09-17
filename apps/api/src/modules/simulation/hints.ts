import type { Diagnostic } from '@tplab/shared';

/**
 * Catalogo de explicacoes em portugues para os erros mais frequentes de quem
 * esta comecando em Verilog (RF05-I03). Cada regra casa contra `message` (ja
 * extraido pelo parser, sem o prefixo `arquivo:linha:`), nunca contra `raw` -
 * `message` e o texto estavel, `raw` muda de formato entre iverilog e vvp.
 *
 * So entra padrao que apareceu de fato numa saida real do `tplab-sandbox`
 * (ver `diagnostics.test.ts`), nunca por suposicao - catalogo tende a crescer
 * sem criterio quando a regra e "pode ser util algum dia".
 */
const HINT_RULES: ReadonlyArray<{ pattern: RegExp; hint: string }> = [
  {
    pattern: /^Unknown module type:\s*(\S+)/i,
    hint: 'O modulo referenciado nao foi encontrado. Confira se o nome usado na instanciacao e exatamente o mesmo do "module" declarado no arquivo de design.',
  },
  {
    pattern: /^I give up\.?$/i,
    hint: 'O compilador parou depois de erros anteriores. Corrija o primeiro erro da lista antes de olhar para os demais - eles costumam ser consequencia dele.',
  },
  {
    pattern: /is not a port of/i,
    hint: 'O nome dessa porta na instanciacao nao existe no modulo. Confira se o nome esta escrito igual nos dois arquivos (design e testbench).',
  },
  {
    pattern: /expects \d+ bits?, got \d+/i,
    hint: 'A largura do sinal conectado nao e igual a largura da porta. Confira o "[N:0]" declarado dos dois lados da conexao.',
  },
  {
    // O prefixo "sorry:" ja foi removido de `message` pelo parser (vira
    // `severity`); o texto que sobra sempre fala em suporte da ferramenta -
    // confirmado rodando `let` (construcao SystemVerilog nao suportada) de
    // proposito contra o tplab-sandbox:latest.
    pattern: /not currently supported/i,
    hint: 'Essa construcao nao e suportada pelo Icarus Verilog - nao e um erro no seu codigo, e sim uma limitacao da ferramenta. Procure uma forma equivalente de escrever o mesmo circuito.',
  },
  // "syntax error" por ultimo: e o padrao mais generico do catalogo e outras
  // mensagens (ex.: "Unknown module type") tambem citam "error" no texto.
  {
    pattern: /syntax error/i,
    hint: 'Provavelmente falta um ";", um "end" ou um "endmodule" nessa linha ou na linha anterior - o Icarus costuma apontar a linha seguinte ao erro real.',
  },
];

/** Primeira regra que casar vence; nenhuma regra casando deixa `hint: null`. */
export function hintFor(message: string): string | null {
  for (const rule of HINT_RULES) {
    if (rule.pattern.test(message)) return rule.hint;
  }
  return null;
}

/** Enriquece cada diagnostico com sua explicacao, sem alterar mais nada. */
export function attachHints(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return diagnostics.map((diagnostic) => ({ ...diagnostic, hint: hintFor(diagnostic.message) }));
}

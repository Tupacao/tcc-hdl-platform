import type { Diagnostic } from '@tplab/shared';

/**
 * Catálogo de explicações em português para os erros mais frequentes de quem
 * está começando em Verilog (RF05-I03). Cada regra casa contra `message` (já
 * extraído pelo parser, sem o prefixo `arquivo:linha:`), nunca contra `raw` —
 * `message` é o texto estável, `raw` muda de formato entre iverilog e vvp.
 *
 * Cada regra traz um `title` (manchete curta, mostrada em destaque no console)
 * e um `hint` (explicação e próxima ação). A mensagem original da ferramenta
 * nunca é substituída: o console a mantém visível como informação secundária.
 *
 * Só entra padrão que apareceu de fato numa saída real do `tplab-sandbox`
 * (ver `diagnostics.test.ts`), nunca por suposição — catálogo tende a crescer
 * sem critério quando a regra é "pode ser útil algum dia". Títulos e dicas são
 * conservadores: dizem "provavelmente" quando a causa é heurística.
 */
interface HintRule {
  pattern: RegExp;
  title: (match: RegExpMatchArray) => string;
  hint: string;
}

const HINT_RULES: ReadonlyArray<HintRule> = [
  {
    pattern: /^Unknown module type:\s*(\S+)/i,
    title: (match) => `O módulo ${match[1]} não foi encontrado`,
    hint: 'Confira se o nome usado na instanciação é exatamente o mesmo do "module" declarado no arquivo de design.',
  },
  {
    pattern: /^I give up\.?$/i,
    title: () => 'O compilador parou por causa de erros anteriores',
    hint: 'Corrija o primeiro erro da lista antes de olhar para os demais — eles costumam ser consequência dele.',
  },
  {
    pattern: /is not a port of/i,
    title: () => 'Porta inexistente no módulo',
    hint: 'O nome dessa porta na instanciação não existe no módulo. Confira se está escrito igual nos dois arquivos (design e testbench).',
  },
  {
    pattern: /expects \d+ bits?, got \d+/i,
    title: () => 'Largura de sinal incompatível',
    hint: 'A largura do sinal conectado não é igual à largura da porta. Confira o "[N:0]" declarado dos dois lados da conexão.',
  },
  {
    // O prefixo "sorry:" já foi removido de `message` pelo parser (vira
    // `severity`); o texto que sobra sempre fala em suporte da ferramenta —
    // confirmado rodando `let` (construção SystemVerilog não suportada) de
    // propósito contra o tplab-sandbox:latest.
    pattern: /not currently supported/i,
    title: () => 'Construção não suportada pelo Icarus Verilog',
    hint: 'Não é um erro no seu código, e sim uma limitação da ferramenta. Procure uma forma equivalente de escrever o mesmo circuito.',
  },
  {
    // Saída real do tplab-sandbox para `always @* $display(1);` (aviso, a
    // simulação roda normalmente) - texto do Figma 2.3 e 4.1.
    pattern: /@\* found no sensitivities/i,
    title: () => 'O bloco always @* nunca será disparado',
    hint: 'Ele não lê nenhum sinal, então nada o aciona. Verifique se faltou algo dentro dele.',
  },
  // "syntax error" por último: é o padrão mais genérico do catálogo e outras
  // mensagens (ex.: "Unknown module type") também citam "error" no texto.
  {
    pattern: /syntax error/i,
    title: () => 'Erro de sintaxe',
    hint: 'Provavelmente falta um ";", um "end" ou um "endmodule" nessa linha ou na linha anterior — o Icarus costuma apontar a linha seguinte ao erro real.',
  },
];

export interface Explanation {
  title: string;
  hint: string;
}

/** Primeira regra que casar vence; nenhuma regra casando devolve `null`. */
export function explanationFor(message: string): Explanation | null {
  for (const rule of HINT_RULES) {
    const match = message.match(rule.pattern);
    if (match) return { title: rule.title(match), hint: rule.hint };
  }
  return null;
}

/** Enriquece cada diagnóstico com título e explicação, sem alterar mais nada. */
export function attachHints(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return diagnostics.map((diagnostic) => {
    const explanation = explanationFor(diagnostic.message);
    return { ...diagnostic, title: explanation?.title ?? null, hint: explanation?.hint ?? null };
  });
}

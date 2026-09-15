/**
 * Termos de SystemVerilog/VHDL que o publico-alvo (vindo de tutorial na
 * internet) tenta colar e o Icarus (`-g2012`) nao aceita (RF11-I01, Figma
 * 7.6 "Busca sem resultado"). Deliberadamente pequeno - so os que ja
 * aparecem citados como fora de escopo em `docs/requisitos/funcional/RF11/
 * feature.md` e na secao "O que o TP Lab nao faz"; crescer sem criterio vira
 * um LRM ruim (risco registrado em RF11-I03).
 */
const OUT_OF_SCOPE_TERMS: Record<string, string> = {
  always_ff: 'always @(posedge clk)',
  always_comb: 'assign (ou always @(*))',
  logic: 'wire ou reg, conforme o uso',
  unique_case: 'case (sem o unique)',
  interface: 'sem equivalente direto - agrupe as portas manualmente',
};

export interface OutOfScopeMatch {
  term: string;
  verilogEquivalent: string;
}

/** Normaliza para bater `always_ff`, `always_ff)`, `unique case` etc. */
function normalizeTerm(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function findOutOfScopeMatch(query: string): OutOfScopeMatch | null {
  const normalized = normalizeTerm(query);
  if (!normalized) return null;

  const equivalent = OUT_OF_SCOPE_TERMS[normalized];
  return equivalent ? { term: normalized, verilogEquivalent: equivalent } : null;
}

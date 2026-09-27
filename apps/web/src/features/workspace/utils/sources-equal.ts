import type { HdlSources } from '@tplab/shared';

/** Comparação rasa de conteúdo (RF07-I03) - decide se o projeto aberto tem alterações não salvas. */
export function sourcesEqual(a: HdlSources, b: HdlSources): boolean {
  return (
    a.language === b.language &&
    a.topModule === b.topModule &&
    a.design.name === b.design.name &&
    a.design.content === b.design.content &&
    a.testbench.name === b.testbench.name &&
    a.testbench.content === b.testbench.content
  );
}

/** Quais arquivos diferem da versão salva - a aba de cada um mostra a marca (RF09-I03). */
export function changedFiles(
  current: HdlSources,
  saved: HdlSources,
): { design: boolean; testbench: boolean } {
  return {
    design:
      current.design.name !== saved.design.name || current.design.content !== saved.design.content,
    testbench:
      current.testbench.name !== saved.testbench.name ||
      current.testbench.content !== saved.testbench.content,
  };
}

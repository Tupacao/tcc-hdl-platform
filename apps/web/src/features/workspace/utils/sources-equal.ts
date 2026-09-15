import type { HdlSources } from '@tplab/shared';

/** Comparacao rasa de conteudo (RF07-I03) - decide se o projeto aberto tem alteracoes nao salvas. */
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

import type { HdlSources } from '@tplab/shared';
import { SAMPLE_SOURCES } from '../../../lib/samples';

/**
 * Ponto de partida "Em branco" (diálogo "Novo projeto", Figma): um esqueleto
 * mínimo, não um arquivo vazio de verdade - um `.v` sem nenhum módulo não
 * compila, o que tornaria "em branco" uma armadilha em vez de um início.
 */
export function buildBlankSources(name: string): HdlSources {
  return {
    language: 'verilog',
    topModule: `${name}_tb`,
    design: {
      name: `${name}.v`,
      content: `module ${name} (\n\n);\n\nendmodule\n`,
    },
    testbench: {
      name: `${name}_tb.v`,
      content: `module ${name}_tb;\n\n    ${name} dut (\n\n    );\n\nendmodule\n`,
    },
  };
}

/**
 * Ponto de partida "Começar com um exemplo": reaproveita `SAMPLE_SOURCES`
 * (único exemplo até o catálogo de RF20 existir) renomeando arquivos e módulo
 * para o nome escolhido - sem isso, o título do card ("meu_projeto.v") e o
 * nome real do arquivo aberto no editor ("full_adder.v") divergiriam.
 */
export function buildSampleSources(name: string): HdlSources {
  const baseIdentifier = SAMPLE_SOURCES.design.name.replace(/\.v$/, '');
  const testbenchIdentifier = SAMPLE_SOURCES.testbench.name.replace(/\.v$/, '');
  // A variante "_tb" precisa ser trocada antes da base: `\bfull_adder\b` não
  // bate dentro de "full_adder_tb" (sublinhado é caractere de palavra, então
  // não há fronteira ali) - sem esta ordem, o módulo do testbench e o
  // `$dumpvars` ficariam com o nome antigo.
  const renameTestbench = new RegExp(`\\b${testbenchIdentifier}\\b`, 'g');
  const renameBase = new RegExp(`\\b${baseIdentifier}\\b`, 'g');
  const rename = (text: string) =>
    text.replace(renameTestbench, `${name}_tb`).replace(renameBase, name);

  return {
    ...SAMPLE_SOURCES,
    topModule: rename(SAMPLE_SOURCES.topModule),
    design: {
      name: `${name}.v`,
      content: rename(SAMPLE_SOURCES.design.content),
    },
    testbench: {
      name: `${name}_tb.v`,
      content: rename(SAMPLE_SOURCES.testbench.content),
    },
  };
}

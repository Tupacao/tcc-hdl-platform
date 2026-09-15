import type { DocSection } from '../models/types';
import { ExemploSomadorSection } from './exemplo-somador';
import { OQueNaoFazSection } from './o-que-nao-faz';

/**
 * Fonte unica do indice, da busca e da navegacao Anterior/Proximo (RF11-I01).
 * O guia de inicio rapido (RF11-I02) e a referencia de sintaxe (RF11-I03)
 * entram aqui como novas entradas em 'inicio-rapido'/'referencia', cada uma
 * com seu componente em `content/`.
 */
export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'exemplo-somador',
    category: 'inicio-rapido',
    title: 'Exemplo: somador completo',
    summary: 'Design e testbench prontos para simular, com $dumpfile/$dumpvars explicados.',
    Component: ExemploSomadorSection,
  },
  {
    id: 'o-que-nao-faz',
    category: 'ajuda',
    title: 'O que o TP Lab nao faz',
    summary: 'Sintese, FPGA, VHDL/SystemVerilog e depuracao passo a passo ficam fora do MVP - o que usar em vez disso.',
    Component: OQueNaoFazSection,
  },
];

/** Id da secao que a busca sem resultado linka quando o termo e fora de escopo (docs-search-empty.tsx). */
export const OUT_OF_SCOPE_SECTION_ID = 'o-que-nao-faz';

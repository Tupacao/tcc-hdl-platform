import type { DocSection } from '../models/types';
import { InicioRapidoSection } from './inicio-rapido';
import { OQueNaoFazSection } from './o-que-nao-faz';

/**
 * Fonte unica do indice, da busca e da navegacao Anterior/Proximo (RF11-I01).
 * A referencia de sintaxe (RF11-I03) entra aqui como nova entrada em
 * 'referencia', com seu componente em `content/`.
 */
export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'primeiro-projeto',
    category: 'inicio-rapido',
    title: 'Primeiro projeto',
    summary:
      'O caminho minimo ate a primeira forma de onda: mapa da tela, design, testbench, executar e ler o resultado.',
    Component: InicioRapidoSection,
  },
  {
    id: 'o-que-nao-faz',
    category: 'ajuda',
    title: 'O que o TP Lab nao faz',
    summary:
      'Sintese, FPGA, VHDL/SystemVerilog e depuracao passo a passo ficam fora do MVP - o que usar em vez disso.',
    Component: OQueNaoFazSection,
  },
];

/** Id da secao que a busca sem resultado linka quando o termo e fora de escopo (docs-search-empty.tsx). */
export const OUT_OF_SCOPE_SECTION_ID = 'o-que-nao-faz';

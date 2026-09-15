import type { DocSection } from '../models/types';
import { InicioRapidoSection } from './inicio-rapido';
import { ReferenciaVerilogSection } from './referencia-verilog';
import { OQueNaoFazSection } from './o-que-nao-faz';

/**
 * Fonte única do índice, da busca e da navegação Anterior/Próximo (RF11-I01).
 */
export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'primeiro-projeto',
    category: 'inicio-rapido',
    title: 'Primeiro projeto',
    summary:
      'O caminho mínimo até a primeira forma de onda: mapa da tela, design, testbench, executar e ler o resultado.',
    Component: InicioRapidoSection,
  },
  {
    id: 'sintaxe-verilog',
    category: 'referencia',
    title: 'Sintaxe básica de Verilog',
    summary:
      'Módulo, portas, parâmetros, wire e reg, números com base, operadores, always, case, testbench e o que fica fora desta versão.',
    Component: ReferenciaVerilogSection,
  },
  {
    id: 'o-que-nao-faz',
    category: 'ajuda',
    title: 'O que o TP Lab não faz',
    summary:
      'Síntese, FPGA, VHDL/SystemVerilog e depuração passo a passo ficam fora do MVP - o que usar em vez disso.',
    Component: OQueNaoFazSection,
  },
];

/** Id da seção que a busca sem resultado linka quando o termo é fora de escopo (docs-search-empty.tsx). */
export const OUT_OF_SCOPE_SECTION_ID = 'o-que-nao-faz';

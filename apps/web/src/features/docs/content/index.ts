import type { DocSection } from '../models/types';
import { ExemploSomadorSection } from './exemplo-somador';

/**
 * Fonte unica do indice, da busca e do roteamento interno do painel (RF11-I01).
 * O guia de inicio rapido (RF11-I02) e a referencia de sintaxe (RF11-I03) entram
 * aqui como novas entradas, cada uma com seu componente em `content/`.
 */
export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'exemplo-somador',
    title: 'Exemplo: somador completo',
    summary: 'Design e testbench prontos para simular, com $dumpfile/$dumpvars explicados.',
    Component: ExemploSomadorSection,
  },
];

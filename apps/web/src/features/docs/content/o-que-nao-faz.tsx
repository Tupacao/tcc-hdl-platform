import { ArrowRight } from 'lucide-react';
import type { DocSectionContentProps } from '../models/types';

interface ScopeItem {
  title: string;
  body: string;
  useInstead: string;
}

const SCOPE_ITEMS: ScopeItem[] = [
  {
    title: 'Sintese logica e gravacao em FPGA',
    body: 'Traduzir o Verilog em portas reais, posicionar, rotear e gravar o bitstream no chip. E o fluxo que transforma descricao em hardware.',
    useInstead: 'Vivado (AMD) ou Quartus Prime (Intel)',
  },
  {
    title: 'VHDL e SystemVerilog',
    body: 'Apenas Verilog nesta versao. A arquitetura de execucao ja esta pensada para receber o GHDL depois, mas ele nao esta ligado.',
    useInstead: 'GHDL para VHDL, local ou no EDA Playground',
  },
  {
    title: 'Depuracao passo a passo',
    body: 'Pontos de parada, execucao linha a linha e inspecao de sinais internos durante a simulacao.',
    useInstead: 'Questa-Intel FPGA, edicao Starter gratuita',
  },
  {
    title: 'Edicao colaborativa em tempo real',
    body: 'Duas pessoas escrevendo no mesmo circuito ao mesmo tempo. O link publico e somente leitura.',
    useInstead: 'Compartilhe o link e combine quem edita',
  },
];

const JOURNEY = [
  { badge: 'voce esta aqui', title: 'TP Lab', body: 'descrever e simular no navegador' },
  { badge: 'proximo passo', title: 'Icarus / GHDL', body: 'o mesmo fluxo, agora pelo terminal' },
  { badge: 'destino', title: 'Vivado / Quartus', body: 'sintetizar e gravar em uma FPGA' },
];

/**
 * RF11-I01 (Figma 7.3) - dizer o que a ferramenta nao faz e tratado aqui
 * como o contrario de fraqueza: o TP Lab se posiciona como camada
 * intermediaria de transicao, e uma camada de transicao precisa mostrar
 * para onde transiciona. Sem esta pagina, o estudante confunde os limites
 * do MVP com os limites da propria HDL. Tambem e o destino do "equivalente
 * em Verilog" que a busca sem resultado sugere (docs-search-empty.tsx).
 */
export function OQueNaoFazSection(_props: DocSectionContentProps) {
  return (
    <article className="flex flex-col gap-6 text-sm leading-relaxed">
      <p>
        O TP Lab cobre a parte do fluxo em que se aprende a descrever e simular
        circuitos. Ele nao substitui as ferramentas da industria - prepara
        para elas. Saber onde ele para e parte de saber usa-lo.
      </p>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Fora do escopo</h2>
        <div className="flex flex-col gap-4">
          {SCOPE_ITEMS.map((item) => (
            <div key={item.title} className="rounded-md border p-4">
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="mt-1 text-muted-foreground">{item.body}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowRight aria-hidden className="size-3.5" />
                {item.useInstead}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Para onde ir depois</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {JOURNEY.map((step) => (
            <div key={step.title} className="rounded-md border p-3">
              <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {step.badge}
              </span>
              <p className="mt-2 text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

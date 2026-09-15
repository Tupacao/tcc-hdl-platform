import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note } from '../components/note';
import type { DocSectionContentProps } from '../models/types';

interface ScopeItem {
  title: string;
  body: string;
  useInstead: string;
}

const SCOPE_ITEMS: ScopeItem[] = [
  {
    title: 'Síntese lógica e gravação em FPGA',
    body: 'Traduzir o Verilog em portas reais, posicionar, rotear e gravar o bitstream no chip. É o fluxo que transforma descrição em hardware.',
    useInstead: 'Vivado (AMD) ou Quartus Prime (Intel)',
  },
  {
    title: 'VHDL e SystemVerilog',
    body: 'Apenas Verilog nesta versão. A arquitetura de execução já está pensada para receber o GHDL depois, mas ele não está ligado.',
    useInstead: 'GHDL para VHDL, local ou no EDA Playground',
  },
  {
    title: 'Depuração passo a passo',
    body: 'Pontos de parada, execução linha a linha e inspeção de sinais internos durante a simulação.',
    useInstead: 'Questa-Intel FPGA, edição Starter gratuita',
  },
  {
    title: 'Edição colaborativa em tempo real',
    body: 'Duas pessoas escrevendo no mesmo circuito ao mesmo tempo. O link público é somente leitura.',
    useInstead: 'Compartilhe o link e combine quem edita',
  },
];

/** Cores por etapa, Figma 7.3 "Para onde ir depois": laranja (aqui), azul de wave-level (próximo), neutro (destino). */
const JOURNEY = [
  {
    badge: 'você está aqui',
    title: 'TP Lab',
    body: 'descrever e simular no navegador',
    border: 'border-primary',
    badgeClass: 'bg-primary/10 text-primary-strong',
  },
  {
    badge: 'próximo passo',
    title: 'Icarus / GHDL',
    body: 'o mesmo fluxo, agora pelo terminal',
    border: 'border-wave-level',
    badgeClass: 'bg-wave-level/10 text-wave-level',
  },
  {
    badge: 'destino',
    title: 'Vivado / Quartus',
    body: 'sintetizar e gravar em uma FPGA',
    border: 'border-muted-foreground/40',
    badgeClass: 'bg-muted text-muted-foreground',
  },
];

/**
 * RF11-I01 (Figma 7.3) - dizer o que a ferramenta não faz é tratado aqui
 * como o contrário de fraqueza. Também é o destino do "equivalente em
 * Verilog" que a busca sem resultado sugere (docs-search-empty.tsx). A
 * justificativa completa ("Por que esta página existe") é conteúdo do
 * próprio Figma (`NotaPosicionamento`), por isso vira `Note` renderizada,
 * não só comentário de código.
 */
export function OQueNaoFazSection(_props: DocSectionContentProps) {
  return (
    <article className="flex flex-col gap-6 text-sm leading-relaxed">
      <p>
        O TP Lab cobre a parte do fluxo em que se aprende a descrever e simular
        circuitos. Ele não substitui as ferramentas da indústria - prepara
        para elas. Saber onde ele para é parte de saber usá-lo.
      </p>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Fora do escopo</h2>
        <div className="flex flex-col gap-4">
          {SCOPE_ITEMS.map((item) => (
            <div key={item.title} className="rounded-md border p-4">
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="mt-1 text-muted-foreground">{item.body}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary-strong">
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
            <div key={step.title} className={cn('rounded-md border p-3', step.border)}>
              <span
                className={cn(
                  'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                  step.badgeClass,
                )}
              >
                {step.badge}
              </span>
              <p className="mt-2 text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      <Note title="Por que esta página existe">
        Dizer o que a ferramenta não faz costuma ser tratado como fraqueza.
        Aqui é o contrário: o TP Lab se posiciona como camada intermediária de
        transição, e uma camada de transição precisa mostrar para onde
        transiciona. Sem esta página, o estudante confunde os limites do MVP
        com os limites da própria HDL.
      </Note>
    </article>
  );
}

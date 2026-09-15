import { SAMPLE_SOURCES } from '@/lib/samples';
import { CodeBlock } from '../components/code-block';
import type { DocSectionContentProps } from '../models/types';

/**
 * Unica secao de conteudo da estrutura (RF11-I01) - os textos do guia de
 * inicio rapido e da referencia de sintaxe sao RF11-I02/I03. Esta secao
 * reaproveita o exemplo real de RF20 (`SAMPLE_SOURCES`) para exercitar o
 * mecanismo de "abrir no editor" com algo que ja existe e funciona hoje,
 * em vez de um texto placeholder que descreveria algo que ainda nao existe.
 */
export function ExemploSomadorSection({ onOpenInEditor }: DocSectionContentProps) {
  return (
    <article className="flex flex-col gap-4 text-sm leading-relaxed">
      <p>
        O somador completo de 1 bit e o projeto de exemplo do TPLab: um circuito
        combinacional pequeno, com testbench comentado, pronto para simular sem
        escrever nada do zero.
      </p>

      <div>
        <h2 className="mb-1 text-sm font-semibold">Design ({SAMPLE_SOURCES.design.name})</h2>
        <CodeBlock
          fileName={SAMPLE_SOURCES.design.name}
          code={SAMPLE_SOURCES.design.content}
          onOpenInEditor={() => onOpenInEditor(SAMPLE_SOURCES)}
        />
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold">
          Testbench ({SAMPLE_SOURCES.testbench.name})
        </h2>
        <p className="mb-2 text-muted-foreground">
          O testbench instancia o design e usa <code>$dumpfile</code>/
          <code>$dumpvars</code> para gerar a forma de onda - sem essas duas
          linhas a simulacao roda, mas o visualizador fica vazio.
        </p>
        <CodeBlock
          fileName={SAMPLE_SOURCES.testbench.name}
          code={SAMPLE_SOURCES.testbench.content}
          onOpenInEditor={() => onOpenInEditor(SAMPLE_SOURCES)}
        />
      </div>
    </article>
  );
}

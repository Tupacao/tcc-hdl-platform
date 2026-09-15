import { SAMPLE_SOURCES } from '@/lib/samples';
import { CodeBlock } from '../components/code-block';
import type { DocSectionContentProps } from '../models/types';

/**
 * RF11-I02 - guia de início rápido ("Primeiro projeto", Figma 7.1). Usa o
 * exemplo real de RF20 (`SAMPLE_SOURCES`, somador completo de 1 bit) como fio
 * condutor. Os dois erros da seção "Quando der errado" foram reproduzidos de
 * verdade na imagem `tplab-sandbox:latest` (iverilog -g2012) para garantir
 * que o texto mostrado é exatamente o que a pessoa vai ver, não uma
 * aproximação - ver `docs/requisitos/funcional/RF11/issue-02-guia-inicio-
 * rapido.md`.
 *
 * Atalhos de teclado (passo 4 do issue doc) ficaram de fora: RF09-I02 (fonte
 * de dados dos atalhos) ainda não existe, e o próprio issue doc pede para não
 * reescrever a lista à mão para não desatualizar sozinha.
 */
export function InicioRapidoSection({ onOpenInEditor }: DocSectionContentProps) {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed">
      <p>
        O TP Lab é um lugar para escrever um circuito digital em Verilog, simular
        e ver o resultado - tudo no navegador, sem instalar nada. Em uns cinco
        minutos você vai passar por um circuito de verdade, do código à forma de
        onda.
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Mapa da tela</h2>
        <p>
          A tela do editor tem quatro partes. As abas em cima trocam entre o
          arquivo de <strong>design</strong> (o circuito) e o de{' '}
          <strong>testbench</strong> (quem testa o circuito). Embaixo do editor
          fica o <strong>console</strong>, onde aparecem os erros de compilação e
          a saída do testbench. Do lado direito ficam as{' '}
          <strong>formas de onda</strong> depois de rodar. O botão{' '}
          <strong>Executar</strong>, no canto superior direito, compila os dois
          arquivos e roda a simulação.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">O arquivo de design</h2>
        <p>
          Um circuito em Verilog é um <code>module</code>: um nome, uma lista de
          portas de entrada e saída entre parênteses, e o corpo entre o
          cabeçalho e <code>endmodule</code>. O exemplo abaixo é um somador
          completo de 1 bit - recebe dois bits e um vai-um de entrada, devolve a
          soma e o vai-um de saída.
        </p>
        <CodeBlock
          fileName={SAMPLE_SOURCES.design.name}
          code={SAMPLE_SOURCES.design.content}
          onOpenInEditor={() => onOpenInEditor(SAMPLE_SOURCES)}
        />
        <p className="text-muted-foreground">
          Não há campo para escolher qual módulo é o "principal": o TP Lab
          elege automaticamente o módulo que o testbench instancia.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">O arquivo de testbench</h2>
        <p>
          O testbench é outro <code>module</code>, sem portas, que instancia o
          design e aplica valores nas entradas dele. Duas linhas são
          obrigatórias para existir forma de onda: <code>$dumpfile</code> diz o
          nome do arquivo `.vcd` gerado, e <code>$dumpvars</code> diz quais
          sinais gravar (o `0` como primeiro argumento grava todos os sinais,
          recursivamente, a partir do módulo indicado). Sem essas duas linhas a
          simulação roda normalmente, só que o visualizador fica vazio - isso
          não é erro, é um testbench que não pediu forma de onda.
        </p>
        <p>
          <code>$finish</code> encerra a simulação. Sem ele, o testbench nunca
          termina sozinho e a execução é interrompida por tempo limite (10 s) -
          também sem gerar mensagem de erro de compilação, só um resultado sem
          saída completa.
        </p>
        <CodeBlock
          fileName={SAMPLE_SOURCES.testbench.name}
          code={SAMPLE_SOURCES.testbench.content}
          onOpenInEditor={() => onOpenInEditor(SAMPLE_SOURCES)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Executar e ler o resultado</h2>
        <p>
          Clique em <strong>Executar</strong>. O console mostra a saída do
          testbench - no exemplo, uma linha por combinação de entradas testada -
          e, se algo não compilar, o erro com arquivo e número de linha. Clicar
          num erro do console leva direto à linha correspondente no editor.
        </p>
        <CodeBlock
          fileName="Console"
          language="text"
          code={`VCD info: dumpfile wave.vcd opened for output.
a=0 b=0 cin=0 -> sum=0 cout=0
a=0 b=0 cin=1 -> sum=1 cout=0
a=0 b=1 cin=0 -> sum=1 cout=0
a=0 b=1 cin=1 -> sum=0 cout=1
a=1 b=0 cin=0 -> sum=1 cout=0
a=1 b=0 cin=1 -> sum=0 cout=1
a=1 b=1 cin=0 -> sum=0 cout=1
a=1 b=1 cin=1 -> sum=1 cout=1
/work/full_adder_tb.v:21: $finish called at 80000 (1ps)`}
        />
        <p className="text-muted-foreground">
          O <code>/work/</code> no caminho é a pasta temporária de cada execução
          isolada - não existe no seu projeto, é normal aparecer nas mensagens.
          Arquivos muito grandes não chegam a compilar: o limite é 256 KB por
          arquivo.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Ler a forma de onda</h2>
        <p>
          Cada sinal vira uma linha; o tempo corre da esquerda para a direita.
          Clique em qualquer ponto da forma de onda para posicionar o cursor de
          tempo - os valores de cada sinal selecionado naquele instante aparecem
          numa tabela abaixo. Use a roda do mouse ou os botões de zoom para
          aproximar um trecho específico.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Quando der errado</h2>
        <p>Dois erros aparecem com frequência em quem está começando.</p>

        <div>
          <h3 className="mb-1 text-sm font-medium">Faltou o ponto e vírgula</h3>
          <CodeBlock
            fileName="Console"
            language="text"
            code={`/work/full_adder.v:10: syntax error
/work/full_adder.v:9: error: Syntax error in left side of continuous assignment.`}
          />
          <p className="mt-2 text-muted-foreground">
            O compilador só percebe a falta do ponto e vírgula na linha
            seguinte - por isso ele aponta a linha 10, mas o problema está na
            linha 9. Quando o erro for "syntax error" sem mais detalhe, olhe
            também a linha anterior à indicada.
          </p>
        </div>

        <div>
          <h3 className="mb-1 text-sm font-medium">Sinal usado sem ter sido declarado</h3>
          <CodeBlock
            fileName="Console"
            language="text"
            code={`/work/full_adder.v:10: error: Unable to bind wire/reg/memory \`cn' in \`full_adder_tb.dut'
/work/full_adder.v:10: error: Unable to elaborate r-value: ((a)&(b))|((cn)&((a)^(b)))
2 error(s) during elaboration.`}
          />
          <p className="mt-2 text-muted-foreground">
            O nome apareceu numa expressão mas nunca foi declarado - quase
            sempre é erro de digitação (aqui, <code>cn</code> em vez de{' '}
            <code>cin</code>).
          </p>
        </div>
      </section>

      <p className="border-t pt-4 text-muted-foreground">
        Chegou até aqui com a forma de onda na tela? É isso - o resto é mudar o
        circuito, executar de novo e ver o que muda.
      </p>
    </article>
  );
}

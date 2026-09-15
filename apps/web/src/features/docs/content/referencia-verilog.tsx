import { CodeBlock } from '../components/code-block';
import type { DocSectionContentProps } from '../models/types';

/**
 * RF11-I03 - referência de sintaxe Verilog (Figma 7.1, grupo "REFERÊNCIA":
 * "Sintaxe básica de Verilog" / "Portas e tipos de sinal" / "Tarefas de
 * sistema"). Mesma decisão de RF11-I02 (ver "Nota de implementação" em
 * `docs/requisitos/funcional/RF11/issue-03-referencia-sintaxe-verilog.md`):
 * nenhum dos três rótulos do índice tem mockup de conteúdo próprio no Figma,
 * só o rótulo de navegação - viraram seções (`h2`) de um único artigo em vez
 * de três páginas vazias de contexto.
 *
 * Todo exemplo abaixo foi compilado de verdade com `iverilog -g2012` na
 * imagem `tplab-sandbox:latest` antes de entrar aqui - inclusive o texto do
 * erro proposital em "wire e reg" e a saída real do gerador de clock em
 * "Testbench", não aproximações.
 */
export function ReferenciaVerilogSection(_props: DocSectionContentProps) {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed">
      <p>
        Uma folha de consulta pequena de propósito: cobre só o que aparece no
        primeiro contato com Verilog dentro do TP Lab, não a linguagem
        inteira. Cada tópico traz para que serve, um exemplo mínimo que
        compila sozinho, e a armadilha comum quando há uma.
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Estrutura de um módulo</h2>
        <p>
          Todo circuito é um <code>module</code>: um nome, uma lista de portas
          entre parênteses e o corpo até <code>endmodule</code>. Portas podem
          ser <code>input</code>, <code>output</code> ou <code>inout</code>{' '}
          (bidirecional, rara no primeiro semestre). <code>parameter</code>{' '}
          declara uma constante configurável por instância - aqui, a largura
          do sinal. Ao instanciar um módulo dentro de outro, ligar as portas
          pelo nome (<code>.porta(sinal)</code>) evita o erro clássico de
          trocar a ordem dos parênteses numa lista posicional.
        </p>
        <CodeBlock
          fileName="estrutura.v"
          code={`module buffer_n #(
    parameter WIDTH = 8
) (
    input  wire [WIDTH-1:0] entrada,
    output wire [WIDTH-1:0] saida
);
    assign saida = entrada;
endmodule

module topo;
    wire [3:0] dado;

    buffer_n #(.WIDTH(4)) buf4 (
        .entrada(4'b1010),
        .saida(dado)
    );
endmodule`}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">wire e reg</h2>
        <p>
          <code>wire</code> é uma ligação - só recebe valor de um{' '}
          <code>assign</code> ou da porta de um módulo instanciado, nunca de
          dentro de um bloco <code>always</code> ou <code>initial</code>.{' '}
          <code>reg</code> guarda um valor entre atribuições e é o tipo usado
          dentro de <code>always</code>/<code>initial</code> - apesar do nome,
          não significa necessariamente um registrador de hardware.
        </p>
        <CodeBlock
          fileName="tipos.v"
          code={`module tipos_demo;
    reg  habilitado;
    wire saida;

    assign saida = habilitado;

    initial habilitado = 1'b1;
endmodule`}
        />
        <div>
          <h3 className="mb-1 text-sm font-medium">Armadilha: atribuir a um wire dentro de always</h3>
          <CodeBlock
            fileName="Console"
            language="text"
            code={`erro_wire.v:5: error: saida is not a valid l-value in erro_wire.
erro_wire.v:2:      : saida is declared here as wire.
Elaboration failed`}
          />
          <p className="mt-2 text-muted-foreground">
            O compilador aponta a linha da atribuição e, logo abaixo, onde o
            sinal foi declarado como <code>wire</code>. A correção é trocar a
            declaração para <code>reg</code> ou mover a lógica para um{' '}
            <code>assign</code>.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Números e valores</h2>
        <p>
          Um literal com base tem o formato <code>&lt;bits&gt;'&lt;base&gt;&lt;valor&gt;</code>:{' '}
          <code>b</code> (binário), <code>h</code> (hexadecimal) ou{' '}
          <code>d</code> (decimal). Sem o prefixo de bits, o literal assume 32
          bits - por isso <code>4'b1010</code> é diferente de <code>1010</code>.
          Além de 0 e 1, um bit pode valer <code>x</code> (desconhecido - não
          inicializado ou conflito) ou <code>z</code> (alta impedância -
          desconectado).
        </p>
        <CodeBlock
          fileName="valores.v"
          code={`module valores_demo;
    wire [3:0] binario         = 4'b1010;
    wire [7:0] hexadecimal     = 8'hFF;
    wire [2:0] decimal         = 3'd5;
    wire [3:0] indefinido      = 4'bxxxx;
    wire [3:0] alta_impedancia = 4'bzzzz;
endmodule`}
        />
        <p className="text-muted-foreground">
          Atribuir um literal maior que a largura declarada trunca os bits
          mais significativos; atribuir um menor estende com zero - as duas
          situações são os avisos de largura mais comuns no console.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Lógica combinacional</h2>
        <p>
          <code>assign</code> descreve um fio cujo valor é recalculado o
          tempo todo, a partir dos operandos à direita. Os operadores mais
          usados: bit a bit (<code>&amp; | ^ ~</code>), lógicos (
          <code>&amp;&amp; || !</code>), aritméticos (<code>+ - * /</code>),
          relacionais (<code>&gt; &lt; &gt;= &lt;= == !=</code>), concatenação
          (<code>{'{a, b}'}</code>), replicação (<code>{'{4{a[0]}}'}</code>) e
          o ternário (<code>condicao ? se_verdadeiro : se_falso</code>).
        </p>
        <CodeBlock
          fileName="combinacional.v"
          code={`module operadores_demo (
    input  wire [3:0] a,
    input  wire [3:0] b,
    output wire [3:0] e_bit_a_bit,
    output wire [3:0] soma,
    output wire        maior,
    output wire [7:0] concatenado,
    output wire [3:0] replicado,
    output wire [3:0] escolhido
);
    assign e_bit_a_bit = a & b;
    assign soma         = a + b;
    assign maior         = (a > b);
    assign concatenado   = {a, b};
    assign replicado     = {4{a[0]}};
    assign escolhido     = (a > b) ? a : b;
endmodule`}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Lógica sequencial</h2>
        <p>
          <code>always @(posedge clk)</code> descreve o que muda a cada borda
          de subida do relógio - a base de um registrador.{' '}
          <code>if</code>/<code>else</code> e <code>case</code> funcionam
          dentro de <code>always</code> como em qualquer linguagem, com um{' '}
          <code>default</code> recomendado no <code>case</code> para não
          deixar sinal sem valor definido em nenhuma combinação.
        </p>
        <CodeBlock
          fileName="registrador.v"
          code={`module registrador (
    input  wire       clk,
    input  wire       reset,
    input  wire [3:0] dado,
    output reg  [3:0] valor
);
    always @(posedge clk) begin
        if (reset)
            valor <= 4'd0;
        else
            valor <= dado;
    end
endmodule`}
        />
        <CodeBlock
          fileName="decodificador.v"
          code={`module decodificador (
    input  wire [1:0] selecao,
    output reg  [3:0] saida
);
    always @(*) begin
        case (selecao)
            2'b00: saida = 4'b0001;
            2'b01: saida = 4'b0010;
            2'b10: saida = 4'b0100;
            default: saida = 4'b1000;
        endcase
    end
endmodule`}
        />
        <div>
          <h3 className="mb-1 text-sm font-medium">Bloqueante (=) versus não bloqueante (&lt;=)</h3>
          <p className="text-muted-foreground">
            Regra prática: dentro de <code>always @(posedge clk)</code>, use
            sempre <code>&lt;=</code> - todas as atribuições do bloco leem os
            valores antigos e atualizam juntas, o comportamento esperado de um
            registrador. Dentro de <code>always @(*)</code> (combinacional,
            como o decodificador acima), use sempre <code>=</code>. Misturar
            os dois no mesmo bloco costuma compilar sem erro nem aviso e
            produzir um circuito que simula diferente do que a leitura do
            código sugere - por isso a armadilha é mais perigosa que um erro
            de compilação.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Testbench</h2>
        <p>
          Um bloco <code>initial</code> executa uma vez, do início da
          simulação em diante - é onde o testbench aplica estímulos.{' '}
          <code>#&lt;n&gt;</code> antes de um comando avança o tempo de
          simulação em <code>n</code> unidades antes de executá-lo.{' '}
          <code>$display</code> imprime uma linha uma vez; <code>$monitor</code>{' '}
          imprime de novo sempre que algum dos sinais citados muda.{' '}
          <code>$dumpfile</code>/<code>$dumpvars</code> ligam a gravação da
          forma de onda (sem eles a simulação roda normalmente, só que sem
          nada para o visualizador mostrar) e <code>$finish</code> encerra a
          simulação - sem ele, a execução para sozinha ao bater no limite de
          tempo do sandbox, sem gerar erro de compilação.
        </p>
        <div>
          <h3 className="mb-1 text-sm font-medium">Gerando estímulos em lote</h3>
          <p>
            <code>integer</code> declara uma variável de 32 bits usada para
            contar, típica de laço - não existe em hardware de verdade, é
            exclusiva de testbench. Um <code>for</code> funciona como em
            qualquer linguagem. A concatenação (<code>{'{a, b, cin}'}</code>)
            também funciona do lado esquerdo de uma atribuição, distribuindo
            os bits de um valor entre vários sinais - e{' '}
            <code>i[2:0]</code> lê só os três bits menos significativos de{' '}
            <code>i</code> (um recorte de intervalo, chamado de part-select).
          </p>
          <CodeBlock
            fileName="estimulo.v"
            code={`module estimulo_tb;
    reg a, b, cin;
    integer i;

    initial begin
        for (i = 0; i < 8; i = i + 1) begin
            {a, b, cin} = i[2:0];
            $display("a=%b b=%b cin=%b", a, b, cin);
        end
    end
endmodule`}
          />
        </div>
        <p>
          Um clock não precisa de <code>always @(posedge clk)</code> para
          existir - um <code>always</code> sem lista de sensibilidade, com um
          atraso fixo, já gera um sinal periódico:
        </p>
        <CodeBlock
          fileName="clock_gen_tb.v"
          code={`module clock_gen_tb;
    reg clk = 0;

    always #5 clk = ~clk;

    initial begin
        $dumpfile("wave.vcd");
        $dumpvars(0, clock_gen_tb);
        $monitor("tempo=%0t clk=%b", $time, clk);
        #50 $finish;
    end
endmodule`}
        />
        <CodeBlock
          fileName="Console"
          language="text"
          code={`VCD info: dumpfile wave.vcd opened for output.
tempo=0 clk=0
tempo=5 clk=1
tempo=10 clk=0
tempo=15 clk=1
tempo=20 clk=0
tempo=25 clk=1
tempo=30 clk=0
tempo=35 clk=1
tempo=40 clk=0
tempo=45 clk=1
clock_gen_tb.v:10: $finish called at 50 (1s)
tempo=50 clk=0`}
        />
        <p className="text-muted-foreground">
          Sem um <code>`timescale`</code> declarado, a unidade de tempo padrão
          é 1 segundo - por isso o console mostra "50 (1s)" em vez de
          nanossegundos. Na prática, declare sempre <code>`timescale`</code>{' '}
          (próxima seção) para controlar a unidade.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Comentários e diretivas</h2>
        <p>
          Comentário de uma linha com <code>//</code>, de bloco com{' '}
          <code>/* */</code>. <code>`timescale</code> define a unidade e a
          precisão de tempo do arquivo (usada pelos atrasos <code>#</code>).{' '}
          <code>`define</code> cria uma constante de texto substituída antes
          da compilação - use <code>`NOME</code>, com crase, para referenciar.
        </p>
        <CodeBlock
          fileName="diretivas.v"
          code={`\`timescale 1ns / 1ps
\`define LARGURA 8

module diretivas_demo;
    // comentario de uma linha
    /* comentario
       de varias linhas */
    wire [\`LARGURA-1:0] dado;

    assign dado = {\`LARGURA{1'b0}};
endmodule`}
        />
      </section>

      <section className="flex flex-col gap-3 border-t pt-4">
        <h2 className="text-base font-semibold">Fora desta versão</h2>
        <p className="text-muted-foreground">
          Construções de SystemVerilog aparecem com frequência em tutorial de
          internet e o Icarus (<code>-g2012</code>) não aceita:{' '}
          <code>logic</code> (use <code>wire</code> ou <code>reg</code>,
          conforme o uso), <code>always_ff</code> (use{' '}
          <code>always @(posedge clk)</code>), <code>always_comb</code> (use{' '}
          <code>assign</code> ou <code>always @(*)</code>),{' '}
          <code>unique case</code> (use <code>case</code>) e{' '}
          <code>interface</code> (sem equivalente direto - agrupe as portas
          manualmente). Buscar por qualquer um desses termos na documentação
          mostra o mesmo equivalente e um atalho para "O que o TP Lab não
          faz", em Ajuda.
        </p>
      </section>
    </article>
  );
}

# RF06 - Visualizador grafico interativo de formas de onda

| Campo | Valor |
| --- | --- |
| ID | RF06 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Feedback ao usuario |
| Status | Nao implementado (o `.vcd` chega; nao ha renderizacao) |
| Requisitos relacionados | RF04, RF09, RF10, RNF01, RNF03, RNF07, RNF09 |

## 1. Enunciado

> A plataforma deve exibir as formas de onda resultantes da simulacao em um
> visualizador grafico interativo.

## 2. O que e

E o painel que transforma o arquivo `.vcd` produzido pelo `vvp` em um grafico de
sinais no tempo - o equivalente ao GTKWave dentro do navegador. Um VCD (Value
Change Dump) e um formato texto com duas partes:

- **cabecalho**: `$timescale`, hierarquia de escopos (`$scope module tb`) e
  declaracoes de sinais (`$var wire 1 ! clk $end`), onde cada sinal ganha um
  identificador curto;
- **corpo**: marcos de tempo (`#0`, `#10`) seguidos das mudancas de valor
  (`1!`, `b1010 #`), registrando apenas o que mudou.

O visualizador precisa fazer tres coisas: interpretar esse formato, desenhar as
transicoes ao longo de um eixo de tempo comum e permitir inspecao - zoom, rolagem,
escolha de sinais e leitura de valor em um instante.

## 3. Para que serve

Simulacao sem forma de onda ensina metade. O `$display` diz o valor em um
instante escolhido pelo autor do testbench; a forma de onda mostra o
comportamento inteiro, incluindo o que ninguem pensou em imprimir - o glitch, o
atraso de propagacao, o sinal que ficou em `x` porque nunca foi inicializado, o
reset que chegou tarde demais.

Para o publico do TPLab e onde a abstracao "codigo" vira a intuicao "hardware".
E, junto com o editor, o motivo de a plataforma existir em vez de um terminal.

## 4. Impacto

**Para o usuario.** E a entrega visual mais forte do produto e a que mais
aparece numa demonstracao de TCC.

**No desempenho do navegador.** E o unico componente que manipula volume de dado
significativo no cliente. Um VCD de poucos megabytes vira dezenas de milhares de
transicoes; renderizar isso com um elemento DOM por transicao trava a aba. A
decisao de arquitetura e desenhar em `<canvas>`, com o modelo de dados separado
da renderizacao.

**Na integracao.** Depende de RF04 entregar um `.vcd` valido e completo (o
truncamento de RF04-I02 precisa preservar o cabecalho). Ocupa o terceiro painel
de RF09 e precisa acompanhar o tema de RF10.

**Na acessibilidade.** Grafico e um canal exclusivamente visual. RNF09 exige, no
minimo, que valores possam ser lidos em texto e que a navegacao funcione por
teclado - o cursor de tempo com leitura textual dos valores cobre os dois.

**Alternativa considerada.** O `docs/PROJECT_CONTEXT.md` cita WaveDrom. WaveDrom
desenha diagramas descritos a mao (JSON), nao arquivos VCD com milhares de
eventos; usa-lo exigiria converter e amostrar o VCD, perdendo precisao. A opcao
adotada aqui e parser proprio + canvas.

## 5. Estado atual no repositorio

- `SimulationResultSchema` ja carrega `vcd: z.string().nullable()`.
- `apps/api/src/modules/simulation/sandbox.ts` le o primeiro `.vcd` do workdir em
  `readVcd`, com teto de `MAX_VCD_BYTES`.
- `apps/web/src/features/workspace/waveform-panel.tsx` e um placeholder
  declarado: conta linhas `$var` para estimar o numero de sinais, mostra o tamanho
  em KB e imprime os primeiros 2000 caracteres do arquivo. O proprio comentario do
  arquivo registra que o renderizador entra depois.
- **Falta**: tudo - parser, modelo de dados, renderizacao, interacao e
  acessibilidade.

## 6. Escopo

**Dentro**

- Parser de VCD para um modelo de sinais e transicoes.
- Renderizacao em canvas de sinais de 1 bit e de barramentos.
- Zoom, deslocamento no tempo, selecao de sinais e cursor de leitura.
- Comportamento adequado com arquivos grandes e com valores `x`/`z`.
- Tema claro/escuro e leitura textual dos valores.

**Fora**

- Edicao de formas de onda ou geracao de estimulos a partir do grafico.
- Comparacao entre duas simulacoes.
- Exportacao do grafico como imagem.
- Reconstrucao de hierarquia completa com navegacao em arvore de escopos (uma
  lista plana com o caminho do sinal basta no MVP).

## 7. Criterios de aceite da feature

- [ ] Executar o exemplo do somador exibe as ondas de `a`, `b`, `cin`, `sum` e
      `cout` alinhadas no tempo.
- [ ] Sinais de mais de 1 bit aparecem como barramento, com o valor escrito
      dentro do segmento quando ha espaco.
- [ ] Valores `x` e `z` sao visualmente distintos de `0` e `1`.
- [ ] Zoom e deslocamento funcionam por mouse e por teclado.
- [ ] Um cursor de tempo mostra, em texto, o valor de cada sinal selecionado
      naquele instante.
- [ ] Um VCD proximo do teto de tamanho renderiza sem travar a interface.
- [ ] O painel respeita o tema claro/escuro e mantem contraste AA.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-parser-vcd.md) | Parser de VCD e modelo de sinais | `feat/rf06-parser-vcd` | M |
| [issue-02](issue-02-renderizacao-canvas.md) | Renderizacao das formas de onda em canvas | `feat/rf06-renderizacao-canvas` | G |
| [issue-03](issue-03-interacao-zoom-cursor.md) | Zoom, deslocamento, selecao de sinais e cursor de tempo | `feat/rf06-interacao-zoom-cursor` | G |
| [issue-04](issue-04-desempenho-acessibilidade.md) | Desempenho com arquivos grandes e acessibilidade | `feat/rf06-desempenho-acessibilidade` | M |

## 9. Dependencias

- Depende de RF04 (o `.vcd`) e do truncamento seguro de RF04-I02.
- Ocupa o painel direito de RF09; segue o tema de RF10.
- Restringido por RNF03 (a partir de 1024px), RNF07 (renderizar rapido) e RNF09.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

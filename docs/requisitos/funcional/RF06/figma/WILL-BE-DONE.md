# Design (Figma) - RF06

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).

RF06 e o componente visual mais denso da plataforma. Frames que cobrem o
escopo pedido para RF06-I02 e RF06-I03:

- [1.2 · Formas de onda — tokens, geometria e anatomia](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=36-2)
  (pagina "1 · Fundamentos") - tokens de cor com contraste verificado
  (`--wave-level`, `--wave-bus`, `--wave-x`, `--wave-z`, `--wave-cursor`,
  `--wave-grid`), e como `x`/`z` se distinguem sem depender de cor.
- [5.1 · Formas de onda — estados](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=79-2)
  (pagina "5 · Formas de onda") cobre:
  - **Seletor de sinais aberto**: dropdown com busca, "selecionar todos ·
    limpar", checkbox por sinal, largura de barramento ao lado do nome
    (ex.: "a[3:0] · 4 bits"), contador "7 de 24".
  - **Muitos sinais · rolagem vertical**: a rolagem e do painel inteiro (nao
    por faixa) para a coluna de nomes acompanhar a onda; valores de
    barramento por segmento.
  - **Zoom aplicado**: regua de tempo com marcas de tempo, `ChipZoom`
    ("400% · 32–48 ns") e um minimapa de tempo mostrando a janela visivel
    dentro da simulacao inteira.
  - **O testbench não gerou formas de onda**: estado vazio explicando a causa
    (`$dumpfile`/`$dumpvars` ausentes) com o trecho de correcao e a acao
    "Inserir no testbench".
- [8.2 · Projeto compartilhado · somente leitura](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=73-2)
  (pagina "8 · Contas e acesso") mostra o mesmo componente em uso real, com
  cursor de tempo, leitura de valores por sinal no cursor e os controles de
  zoom completos (`⏮ − 100% + ⏭ ⤢`).

Todos os frames nos dois temas (a pagina "0 · Home" e a "8.2" cobrem a
variante escura em detalhe; a paleta em si ja e verificada para os dois
modos).

Definicoes fixadas: altura de faixa e espacamento (ver frames acima), cores
derivadas dos tokens com contraste AA, tipografia da regua e dos valores
dentro do barramento.

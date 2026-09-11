# Design (Figma) - RF16

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "7 · Documentação e onboarding".

- [7.4 · Tutorial guiado de primeiro acesso (RF16)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=67-2) -
  4 passos sobre o workspace real, com Pular/Anterior/Proximo.
- [7.7 · Anatomia do tutorial guiado (RF16)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=110-2)
  fecha as medidas e decisoes que faltavam:
  - **Balao, peca por peca**: 376px de largura fixa (nunca adaptavel — um
    balao que muda de tamanho a cada passo obriga o olho a reencontrar os
    botoes 4 vezes), seta de 18×11px, padding 20/22/18/22, indicador de
    progresso com o ponto ativo virando barra de 18px, e "Pular" como texto
    simples, nunca botao — abandonar o tour nao deve ter o mesmo peso visual
    de continuar nele.
  - **Veu nos dois temas** — **decisao fechada**: o veu e **sempre preto**,
    nunca branco, com opacidade menor no claro (50%) que no escuro (68%).
    Veu branco sobre tema claro lava a tela e apaga o realce junto; preto
    funciona nos dois porque o conteudo por baixo, no tema claro, ja e claro
    e escurece com menos opacidade.
  - **Como voltar depois de pular**: item "Refazer o tour" num menu de ajuda
    junto de "Documentação" e "Atalhos de teclado".

Restricoes respeitadas: o balao nao cobre o elemento que explica; o
comportamento em 1024px ainda depende de RNF03, que nao tem frame.

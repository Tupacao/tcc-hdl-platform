# Design (Figma) - RF05

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).

- [2.3 · Workspace 1920 · escuro · erro de compilação (RF05)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=48-2)
  (pagina "2 · Workspace") - item de erro com `arquivo:linha:coluna`,
  tooltip do erro, acao "Ir para a linha".
- [4.1 · Console e diagnósticos — estados](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=78-2) -
  console vazio, saida longa, e "Apenas avisos — a execução foi bem" (badge
  ambar + confirmacao explicita de que rodou ate o fim).
- [7.2 · Documentação · Erros mais comuns (RF05 × RF11)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=65-2) -
  liga o erro a explicacao na documentacao.
- [4.2 · Limites, rejeições e diagnóstico sem linha (RF03 · RF04 · RF05)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=107-2)
  fecha o ultimo item: **diagnostico sem linha**, lado a lado com um
  diagnostico normal para comparar — "somador4.v:19:35" (com linha, clicavel,
  "Ir para a linha →") vs. "projeto · Nenhum modulo de topo encontrado nos
  arquivos · sem posicao no codigo" (sem cursor de clique, nao acende no
  hover, nao alcancavel por Tab). Alguns diagnosticos sao do projeto inteiro,
  nao de um ponto do arquivo — deixa-los clicaveis levaria a linha 1 sem
  explicacao.

Restricoes de acessibilidade confirmadas em uso (RNF09): severidade nunca
comunicada apenas por cor, contraste AA nos dois temas.

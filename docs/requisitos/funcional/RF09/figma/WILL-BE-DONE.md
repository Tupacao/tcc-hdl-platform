# Design (Figma) - RF09

**Status: feito, exceto responsividade.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "2 · Workspace".

RF09 e a tela principal da plataforma: o frame mestre do qual os demais
requisitos sao recortes.

- [2.1 · Workspace 1920 · escuro · execução concluída](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=41-2)
  e
  [2.2 · claro](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=47-2) -
  layout completo com cabecalho, abas, editor, ondas, console e barra de
  estado.
- [2.3](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=48-2),
  [2.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=55-2),
  [2.6](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-2),
  [2.7](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-13) e
  [2.8](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=84-2) -
  variacoes da mesma tela mestre (erro de compilacao, primeiro acesso,
  carregamento inicial, servidor indisponivel, timeout). Ver o
  `WILL-BE-DONE.md` de cada requisito.
- [2.9 · Divisores de painel e atalhos (RF09 · RNF01)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=106-67)
  fecha os dois itens que faltavam:
  - **Divisor de painel**, quatro estados: repouso (linha de 1px em
    `--border`, alca so aparece no hover), hover (alca de 8×42px, cursor
    `col-resize`), arraste (linha laranja com medida ao vivo dos dois
    lados), foco por teclado (anel deslocado + instrucao "← → ajustar"). O
    alvo de 40px do sistema nao se aplica ao divisor — e uma faixa continua
    de altura inteira, ja facil de acertar no eixo que importa.
  - **Dialogo de atalhos de teclado**, acionado por `?` de qualquer lugar:
    Executar (`⌘⏎`), Salvar (`⌘S`), Comentar a linha (`⌘/`), Ir ao proximo
    erro (`F8`), Focar o proximo painel (`⌃⇥`), Abrir os atalhos (`?`). Sai
    do rodape do editor, onde hoje e uma dica em 10px que ninguem le.

**Falta apenas:** o workspace em 1024 e 1366px de largura (RNF03, que ainda
nao tem nenhum frame em nenhuma pagina do arquivo).

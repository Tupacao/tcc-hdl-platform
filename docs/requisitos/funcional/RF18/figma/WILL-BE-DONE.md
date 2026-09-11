# Design (Figma) - RF18

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "3 · Editor de código".

[3.1 · Autocompletar e exemplos prontos (RF18 · RF20)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=68-2)
cobre o cartao "Autocompletar de palavras-chave (RF18)":

- Lista de sugestoes com icone por categoria (palavra-chave vs. esqueleto de
  bloco `always`), ex.: `always`, `always @(*)`, `always @(posedge clk)`,
  `alias`.
- Painel de previa (`PréviaSugestão`) explicando o que a palavra faz e
  apontando para "Documentacao › Sintaxe basica" — decisao de design
  registrada: "sem isso o autocompletar vira um acelerador para quem ja sabe,
  e nao ajuda quem esta aprendendo".
- Dica de teclado inline: "⏎ inserir ⇥ completar esc fechar".
- Restricao ja fechada: so palavras-chave da linguagem, nada de sugerir nomes
  de sinais do proprio arquivo nesta versao.

A lista usa a paleta de sintaxe/tema definida em RF02 (1.4), com contraste
verificado (RNF09).

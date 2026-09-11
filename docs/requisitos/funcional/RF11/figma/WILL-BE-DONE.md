# Design (Figma) - RF11

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "7 · Documentação e onboarding".

Decisao de navegacao fechada: documentacao e **pagina propria**.

- [7.1 · Documentação 1920 · escuro (RF11)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=52-2) -
  busca, navegacao Sintaxe basica / Erros mais comuns, bloco de codigo, nav
  Anterior/Proximo.
- [7.2 · Erros mais comuns (RF05 × RF11)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=65-2)
  e
  [7.3 · O que o TP Lab não faz](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=66-2).
- [7.5 · Documentação 1920 · claro (RF10)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=80-97).
- [1.3 · Tipografia, densidade e glossário](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=38-2)
  fixa a tipografia de conteudo longo.
- [7.6 · Abrir no editor e busca sem resultado (RF11)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=109-2)
  fecha o restante:
  - **Bloco de codigo com duas acoes**: "Abrir no editor" (laranja, a acao
    que a documentacao quer estimular) ao lado de "Copiar" (contorno, a
    escapatoria).
  - **Onde abrir**: se ha um projeto aberto, dialogo "Voce tem 'X' aberto" —
    "Abrir em um projeto novo" (padrao, marcado por default) ou "Substituir
    o conteudo atual" (destrutiva, nunca pre-selecionada).
  - **Busca sem resultado**, tratada com cuidado especifico do escopo do
    MVP: quando o termo buscado e de SystemVerilog/VHDL/sintese (fora de
    escopo), o estado vazio diz isso, aponta o equivalente em Verilog
    (ex.: `always_ff` → `always @(posedge clk)`) e linka "O que o TP Lab nao
    faz" — em vez de um "nenhum resultado" generico que faria a
    documentacao parecer incompleta.

Restricoes respeitadas: contraste AA nos dois temas inclusive no realce de
sintaxe dos blocos de codigo (RNF09); a documentacao nunca oculta o codigo em
edicao a ponto de o usuario perder o contexto.

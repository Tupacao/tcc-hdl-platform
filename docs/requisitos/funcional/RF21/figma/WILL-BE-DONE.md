# Design (Figma) - RF21

**Status: parcial (avancado).** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "9 · Editor visual".

Estende RF12/RF13. [9.1 · Editor visual de circuitos 1920 (RF12 · RF13 · RF21)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=60-2)
inclui o bloco "Flip-flop D" montado no canvas junto com as portas
combinacionais, ja com fios de dado e conexoes distintas.

**Falta confirmar/detalhar:**

- Terminais nomeados de clock (com o triangulo de borda sensivel) e reset
  isolados dos terminais de dado.
- Fio de clock distinguivel dos fios de dado sem depender so de cor (RNF09).
- Um contador de 4 bits especificamente montado como frame de referencia (o
  frame mostra o flip-flop D em uso, mas nao foi confirmado um contador
  completo de 4 bits).
- Marcacao de erro especifica para realimentacao combinacional invalida vs.
  valida atraves de flip-flop.
- Decisao sobre flip-flop de 1 bit vs. registrador de largura configuravel.

Quando esses detalhes forem confirmados, atualizar este documento com os
nomes exatos dos nos internos.

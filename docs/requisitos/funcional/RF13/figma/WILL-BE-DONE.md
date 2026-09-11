# Design (Figma) - RF13

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "9 · Editor visual".

[9.1 · Editor visual de circuitos 1920 (RF12 · RF13 · RF21)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=60-2)
cobre o frame mais importante da feature — a previa do codigo gerado ao lado
do canvas — com estas decisoes ja fechadas:

- **Modo Codigo / Editar como codigo**: alternancia explicita entre ver o
  circuito e ver (e editar) o Verilog gerado.
- **Codigo somente leitura no modo Blocos**: "este codigo e regerado a cada
  mudanca" — o texto explica ao usuario por que o editor esta bloqueado ali.
- **`CódigoBloqueado`**: erro trava a geracao de codigo; aviso nao. A
  distincao usa cor + texto (nunca so cor, RNF09) e existe justamente para o
  estudante ver o Verilog de um circuito parcialmente montado.
- **Estado inicial**: "O codigo gerado ainda nao foi executado. Clique em
  Executar para compilar e simular" — cobre o vinculo com RF04.
- Justificativa de design registrada no proprio frame: "ver o circuito e o
  codigo lado a lado, com o bloco selecionado destacado nas duas superficies,
  e o que faz o estudante associar a porta XOR ao operador `^`."

**Falta:**

- Realce explicito da correspondencia (selecionar um bloco destaca a linha
  correspondente) - mencionado como desejavel no requisito original, ainda
  nao confirmado como frame separado.
- Indicador de sincronia com os quatro estados nomeados (em dia, desatualizado,
  editado a mao, divergente) nao aparece como um componente isolado.

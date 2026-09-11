# Design (Figma) - RF04

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).

RF04 nao tem tela propria, mas define os estados temporais do fluxo
principal — todos ja desenhados:

- [2.4 · Progressão do botão Executar e da barra de estado](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=54-2) -
  repouso, na fila, compilando, simulando.
- [4.1 · Console e diagnósticos — estados](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=78-2) -
  "Cancelar" visivel so durante a execucao, e console vazio antes da
  primeira execucao.
- [2.8 · Simulação interrompida por tempo limite (RNF05)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=84-2) -
  "excedeu o limite de 10 segundos", com "resultado parcial · interrompido
  em 10s" e orientacao sobre `$finish`.
- [5.1 · Formas de onda — estados](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=79-2) -
  "O testbench nao gerou formas de onda", explicando `$dumpfile`/`$dumpvars`.
- [4.2 · Limites, rejeições e diagnóstico sem linha (RF03 · RF04 · RF05)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=107-2)
  fecha o restante:
  - **Saida truncada**: "Saida cortada em 5.000 linhas. O resto foi
    descartado para o console nao travar o navegador. **As formas de onda
    nao foram afetadas.**" — a ressalva final evita que o usuario reexecute
    a toa achando que a simulacao inteira foi comprometida.
  - **Testbench nao instancia o modulo principal** (incoerencia
    `topModule`): aviso, nao erro — o `iverilog` compila e simula
    normalmente, so que "nao sobra nada para ver". Acao de correcao
    "Definir modulo principal" direto no item.

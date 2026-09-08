# Design (Figma) - RF04

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF04 nao tem tela propria, mas define os estados temporais do fluxo principal -
o que o usuario ve entre clicar em "Executar" e receber o resultado. Sao os
frames que precisam existir:

- Progressao do botao "Executar": repouso, na fila, compilando, simulando.
- Acao de cancelar a espera (aparece so durante a execucao).
- Console no estado "simulacao concluida sem forma de onda", com a explicacao
  sobre `$dumpfile`/`$dumpvars`.
- Console no estado "timeout", com orientacao sobre `$finish` e loops sem
  controle de tempo.
- Aviso de saida truncada (stdout e `.vcd`).
- Aviso de incoerencia entre `topModule` e o testbench.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames e
pelos nomes exatos dos nos usados na implementacao.

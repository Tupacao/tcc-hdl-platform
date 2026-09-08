# Design (Figma) - RNF09

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RNF09 nao tem tela propria: e uma restricao sobre todas as cores da plataforma.
O que o Figma precisa entregar:

- **Tabela de tokens com contraste verificado**: cada token de
  `apps/web/src/index.css` com valor no tema claro e no escuro, e a razao de
  contraste calculada contra os fundos em que e usado. Sem isso, cada issue de
  implementacao redescobre o problema.
- **Pares criticos** explicitamente verificados:
  `--muted-foreground` sobre `--background` e sobre `--muted`;
  `--destructive` e `--warning` sobre `--background` e sobre `--card`;
  `--border` e `--input` no tema escuro (hoje branco com 12% e 18% de opacidade);
  `--ring` como indicador de foco sobre cada fundo.
- **Paleta do editor**: cores de token de sintaxe, caso os temas `vs` e `vs-dark`
  do Monaco nao passem na verificacao.
- **Paleta das formas de onda**: nivel logico, barramento, `x`, `z`, grade e
  cursor - todas com contraste verificado nos dois temas.
- **Canais redundantes**: como severidade de diagnostico (RF05) e nivel logico
  (RF06) se distinguem sem depender de cor - forma, icone, tracejado, rotulo.

A regra para o design: um token entregue sem verificacao de contraste vira
retrabalho na implementacao. A verificacao faz parte da entrega.

Quando o arquivo estiver pronto, substituir este documento pelo link e pela
tabela de contraste.

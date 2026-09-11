# Design (Figma) - RNF09

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "1 · Fundamentos".

RNF09 nao tem tela propria: e uma restricao sobre todas as cores da
plataforma. O que o Figma entrega:

- [1.1 · Tokens de cor e contraste verificado](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=34-2) -
  tabela de tokens com valor no tema claro e no escuro, e a razao de
  contraste calculada contra os fundos em que cada um e usado, incluindo os
  pares criticos (`muted-foreground`, `destructive`, `warning`,
  `border`/`input` no escuro, `ring` de foco).
- [1.2 · Formas de onda — tokens, geometria e anatomia](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=36-2) -
  paleta das formas de onda com contraste verificado, e como `x`/`z` se
  distinguem sem depender de cor.
- [1.4 · Destaque de sintaxe Verilog (RF02)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=89-2) -
  paleta do editor.

Os valores e as razoes calculadas estao consolidados em
`docs/design-system-fundamentos.md`.

**Canal redundante de severidade (RF05) confirmado em uso real**, nao so na
tabela de tokens: [4.1 · Console e diagnósticos — estados](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=78-2)
usa badge ambar + texto para aviso (nunca so cor), e
[2.3 · erro de compilação](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=48-2)
usa icone + `arquivo:linha:coluna` + mensagem, nunca cor isolada. A aplicacao
da paleta nos dois temas tambem foi confirmada em telas de produto inteiras
(Workspace, Meus projetos, Documentacao, Contas), nao so na tabela de
Fundamentos.

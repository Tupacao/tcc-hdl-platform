# Design (Figma) - RNF03

**Status: pendente.** O arquivo de Figma existe em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-)
e ja cobre 11 paginas (Home, Fundamentos, Workspace, Editor, Console, Formas
de onda, Projetos, Documentacao, Contas, Editor visual e Avulsos) — mas toda
tela de produto existe apenas em 1920px. Nenhum dos tres breakpoints alvo
(1024/1366/1920) foi desenhado ainda; RNF03 e, hoje, o unico dos blocos de
`docs/FIGMA-PROTOTIPOS.md` sem nenhuma cobertura.

Frames necessarios:

- Workspace em 1024, 1366 e 1920 px de largura - as tres larguras alvo. E o
  frame de 1024 que decide o design, porque e o mais apertado.
- Comportamento abaixo de 1024px: a decisao entre rolagem horizontal (o que o
  codigo faz hoje) e layout adaptado (paineis empilhados ou um de cada vez).
  Esta e a definicao central de RNF03.
- Aviso de largura insuficiente, se a decisao incluir um.
- Larguras minimas por painel, com o conteudo em cada uma: editor com linha de
  codigo tipica sem quebra indesejada, console com uma linha de diagnostico
  legivel, painel de ondas com a coluna de nomes mais um trecho de tempo util.
- Comportamento em tela muito larga: onde o conteudo para de crescer, sobretudo
  na documentacao de RF11, cuja linha de leitura nao deve acompanhar 1920px.

Quando esses frames existirem, atualizar este documento com o link e a tabela
de larguras minimas por painel.

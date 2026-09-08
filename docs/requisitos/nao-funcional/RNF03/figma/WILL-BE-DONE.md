# Design (Figma) - RNF03

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

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

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames e
pela tabela de larguras minimas por painel.

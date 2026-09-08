# Design (Figma) - RF02

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

Frames esperados para esta feature:

- Painel do editor nos temas claro e escuro, com a paleta de tokens de sintaxe
  definida (palavra-chave, tipo, numero, string, comentario, tarefa de sistema).
- Barra de abas de arquivo (design / testbench), incluindo estado ativo, hover,
  foco por teclado e indicador de alteracao nao salva.
- Estado vazio do editor e estado de carregamento do Monaco.
- Especificacao de tipografia: familia monoespacada, tamanho e altura de linha.

Restricoes ja fechadas que o design deve respeitar:

- Cores exclusivamente por tokens de tema (`bg-background`, `text-foreground`,
  ...), com contraste WCAG AA nos dois modos (RNF09).
- Componentes apenas do shadcn/ui, estilo `new-york`.
- Largura minima util de 1024 px (RNF03).

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames e
pelos nomes exatos dos nos.

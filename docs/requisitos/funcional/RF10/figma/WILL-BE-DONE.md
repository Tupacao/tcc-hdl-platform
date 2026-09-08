# Design (Figma) - RF10

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

Frames necessarios:

- Controle de tema com os tres estados (claro, escuro, sistema): fechado, aberto,
  com a opcao ativa marcada, e o estado de foco por teclado.
- Icone que representa o modo "sistema" - hoje o codigo alterna apenas entre sol
  e lua, o que nao comporta o terceiro estado.

Alem dos frames, RF10 depende do design fornecer a **paleta** como fonte de
verdade: cada token de `apps/web/src/index.css` (`--background`, `--foreground`,
`--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`,
`--destructive`, `--success`, `--warning`, `--border`, `--input`, `--ring`) com
valor definido nos dois modos.

Tokens que ainda nao existem e que o design precisa criar, porque os componentes
de RF06 vao precisar deles:

- cores de forma de onda: nivel logico, barramento, `x`, `z`, grade, cursor;
- cores de sintaxe do editor, se o preset `vs`/`vs-dark` do Monaco nao atender ao
  contraste AA (RF02-I02).

A validacao de contraste dos pares e responsabilidade de RNF09, mas comeca aqui:
um token entregue pelo design sem verificacao vira retrabalho.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames e
pela tabela de tokens.

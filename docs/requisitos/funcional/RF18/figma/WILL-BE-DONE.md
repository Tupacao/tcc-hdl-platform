# Design (Figma) - RF18

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF18 tem superficie visual pequena, porque a lista de sugestoes e renderizada
pelo proprio Monaco. O que o design precisa entregar:

- Aparencia da lista de sugestoes nos dois temas: item, item selecionado, icone
  por categoria (palavra-chave, tarefa de sistema, snippet, identificador do
  arquivo) e o painel de descricao.
- Verificacao de contraste da lista - ela e desenhada pelo tema do Monaco, e
  precisa atender AA junto com o restante do editor (RNF09, RF02-I02).

Se o tema padrao do Monaco (`vs` / `vs-dark`) atender ao contraste exigido, o
design pode se limitar a confirmar isso; caso contrario, precisa fornecer os
valores para um tema customizado via `monaco.editor.defineTheme`.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.

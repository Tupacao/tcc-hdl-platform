# Design (Figma) - RF05

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF05 e majoritariamente visual e precisa de frames proprios:

- Item de diagnostico no console: erro, aviso e informativo, nos dois temas.
  Cada um com icone, arquivo:linha, mensagem e estado de foco visivel.
- Item de diagnostico sem linha (nao clicavel) - precisa parecer diferente de um
  item desabilitado por erro.
- Console com lista longa: agrupamento por arquivo e contagem no cabecalho
  ("3 erros, 1 aviso").
- Marcacao dentro do editor: sublinhado, glyph na margem e tooltip.
- Bloco de explicacao amigavel (RF05-I03): como a explicacao em portugues convive
  com a mensagem original do `iverilog` sem esconde-la.
- Console vazio: antes da primeira execucao e depois de uma execucao sem erros.

Restricoes de acessibilidade que o design precisa respeitar (RNF09):

- severidade nunca comunicada apenas por cor;
- contraste AA para `--destructive` e `--warning` sobre `--background` nos dois
  temas;
- foco visivel em todos os itens navegaveis por teclado.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.

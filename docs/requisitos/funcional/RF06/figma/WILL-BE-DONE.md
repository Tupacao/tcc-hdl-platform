# Design (Figma) - RF06

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF06 e o componente visual mais denso da plataforma e precisa de definicao de
design antes da implementacao de RF06-I02 e RF06-I03. Frames necessarios:

- Painel completo em uso: coluna de nomes de sinais a esquerda, area de ondas a
  direita, regua de tempo no topo.
- Anatomia de um sinal de 1 bit: nivel alto, nivel baixo, transicao, `x`, `z`.
- Anatomia de um barramento: segmento com valor escrito, segmento estreito demais
  para o texto, valor `x` parcial.
- Cursor de tempo: linha vertical, marcador na regua e a leitura de valores.
- Seletor de sinais: lista com busca, marcar/desmarcar, ordem, sinal removido.
- Barra de controles: zoom mais, zoom menos, ajustar a janela, ir ao inicio/fim.
- Estados vazios: antes da primeira simulacao; simulacao sem `.vcd`; `.vcd`
  truncado.
- Os tres estados anteriores tambem no tema escuro.

Definicoes que o design precisa fixar para a implementacao:

- altura de uma faixa de sinal e espacamento entre faixas;
- espessura das linhas de onda e da grade de tempo;
- cores: nivel logico, barramento, `x`, `z`, cursor e grade - todas derivadas dos
  tokens de tema (`--foreground`, `--muted-foreground`, `--destructive`,
  `--warning`, `--ring`), com contraste AA nos dois modos (RNF09);
- tipografia da regua de tempo e dos valores dentro do barramento.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames e
pelos tokens exatos.

# Design (Figma) - RF12

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF12 e a feature com maior dependencia de design da plataforma: nada dela pode
ser implementado a partir de descricao textual. Frames necessarios:

- Canvas em uso, com um somador completo montado, nos dois temas.
- Simbolo de cada bloco: AND, OR, NOT, XOR, NAND, NOR, entrada, saida,
  constante. Definir se o desenho segue o padrao distintivo (IEEE 91, formatos
  caracteristicos) ou retangular (IEC) - a decisao afeta reconhecimento pelo
  aluno e reaproveitamento do material da disciplina.
- Estados de um bloco: repouso, hover, selecionado, com erro, arrastando.
- Terminais: entrada, saida, livre, conectado, alvo valido durante o arraste,
  alvo invalido.
- Fio: repouso, selecionado, com erro (ciclo, multiplos drivers), em tracado.
- Paleta de blocos: lista lateral, busca, arrastar para o canvas.
- Controles do canvas: zoom, ajustar a tela, grade, desfazer/refazer.
- Painel de propriedades do bloco selecionado (nome do terminal, valor da
  constante).
- Marcacao de erro de validacao no canvas e a lista de problemas.
- Canvas vazio (primeiro uso), com instrucao inicial.
- Como codigo e circuito convivem no workspace: alternancia entre os dois modos,
  em 1024px.

Decisoes que o design precisa fixar antes de RF12-I01:

- tamanho da grade e alinhamento (snap);
- dimensoes padrao de cada bloco e distancia minima entre terminais para que o
  alvo de clique seja confortavel;
- paleta derivada dos tokens de tema, com contraste AA nos dois modos (RNF09) -
  fio e terminal nao podem depender apenas de cor para comunicar erro.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.

# Design (Figma) - RF21

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

Estende o design de RF12. Frames necessarios:

- Simbolo do flip-flop tipo D: terminais de dado, clock (com o triangulo de borda
  sensivel, convencao que o aluno reconhece do quadro), reset e saida. Estados de
  repouso, selecionado e com erro.
- Blocos de clock e de reset como fontes, visualmente distintos de uma entrada
  comum.
- Fio de clock: como se distingue dos fios de dado sem depender apenas de cor
  (RNF09).
- Um contador de 4 bits montado no canvas - o frame de referencia da feature.
- Marcacao de erro especifica: realimentacao combinacional invalida versus
  realimentacao valida atraves de flip-flop.
- Paleta com a nova secao de blocos sequenciais.

Decisao que o design precisa fixar: o flip-flop e um bloco de 1 bit, exigindo
quatro deles para um contador de 4 bits, ou um registrador de largura
configuravel? A primeira opcao ensina mais e polui mais o canvas; a segunda e
pratica e esconde o conceito. A escolha muda RF21-I01 e RF21-I02.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.

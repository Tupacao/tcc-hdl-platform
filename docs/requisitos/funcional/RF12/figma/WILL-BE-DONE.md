# Design (Figma) - RF12

**Status: parcial (avancado).** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "9 · Editor visual".

- [9.1 · Editor visual de circuitos 1920 (RF12 · RF13 · RF21)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=60-2) -
  canvas em uso com blocos AND, OR, NOT, XOR, NAND (mais o flip-flop D de
  RF21) montados formando um circuito completo, fios com derivacoes (um sinal
  alimentando mais de um destino) e a `PaletaDeComponentes` lateral com os
  simbolos. Inclui a alternancia "Modo Codigo" / "Editar como codigo" com o
  codigo gerado ao lado — ver RF13.
- [9.2 · Editor visual — estados inválidos (RF12)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=81-2) -
  pelo menos um exemplo de bloco sem ligacao ("Bloco XOR sem nenhuma
  ligacao") com dica contextual.

Decisao ja fixada: os simbolos seguem o padrao distintivo (formatos
caracteristicos de AND/OR/NOT/XOR/NAND, nao retangular IEC).

**Falta confirmar/detalhar** (a leitura de metadados nao capturou estados de
interacao isolados — exige inspecao visual dos frames):

- Estados de um bloco: hover, selecionado, arrastando.
- Terminais: alvo valido/invalido durante o arraste.
- Controles do canvas: zoom, ajustar a tela, grade/snap, desfazer/refazer.
- Painel de propriedades do bloco selecionado.
- Canvas vazio (primeiro uso).
- Convivencia codigo x circuito em 1024px (depende de RNF03, que ainda nao
  tem frame).

Quando esses estados forem confirmados, atualizar este documento com os nomes
exatos dos nos internos.

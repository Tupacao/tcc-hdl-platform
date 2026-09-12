# RF06-I02 - Renderizacao das formas de onda em canvas

| Campo | Valor |
| --- | --- |
| Feature | [RF06](feature.md) |
| Branch | `feat-RF06-02-renderizacao-canvas-front` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF06-I01 |
| Status | **Concluido.** PR #6. |

## Contexto

Com o modelo de RF06-I01 pronto, falta desenhar. A escolha e `<canvas>` 2D e nao
SVG/DOM: uma simulacao modesta gera dezenas de milhares de transicoes, e um
elemento por transicao inviabiliza a rolagem. Canvas tambem simplifica o
redesenho ao arrastar os divisores de `react-resizable-panels`.

O painel vive em `apps/web/src/features/workspace/waveform-panel.tsx`, hoje um
placeholder que imprime os primeiros 2000 caracteres do arquivo.

## Objetivo

Desenhar sinais de 1 bit e barramentos ao longo de um eixo de tempo comum, com
regua, grade e nomes, seguindo os tokens de tema da aplicacao.

## Escopo tecnico

- `apps/web/src/features/waveform/waveform-canvas.tsx` (novo)
- `apps/web/src/features/waveform/render.ts` (novo) - desenho puro, sem React
- `apps/web/src/features/workspace/waveform-panel.tsx` - passa a compor os novos
  componentes
- `apps/web/src/index.css` - tokens adicionais, se o design exigir

## Passo a passo

1. Separar layout de desenho: um modulo `render.ts` recebe
   `(ctx, waveform, viewport, theme)` e desenha; o componente React so cuida de
   tamanho, tema e eventos.
2. Definir o `viewport` como `{ startTime, endTime, pixelsPerTime }` - e a unica
   entrada que RF06-I03 vai alterar.
3. Coluna de nomes fixa a esquerda (DOM comum, nao canvas: precisa ser
   selecionavel e acessivel) e area de ondas rolavel a direita, com as duas
   alinhadas verticalmente pela mesma altura de faixa.
4. Regua de tempo no topo, com marcas em intervalos "redondos" para a escala
   atual e rotulos na unidade do `$timescale` (`ns`, `ps`).
5. Desenho de sinal de 1 bit: linha em nivel alto/baixo com transicao vertical.
   `x` como faixa preenchida em cor de erro; `z` como linha no meio da faixa, em
   tracejado.
6. Desenho de barramento: um hexagono/paralelogramo por segmento de valor
   constante, com o valor em hexadecimal escrito dentro quando couber; segmento
   estreito fica sem texto, nunca com texto cortado.
7. Suportar telas de alta densidade: dimensionar o canvas por
   `devicePixelRatio` e escalar o contexto, senao a linha fica borrada.
8. Ler as cores dos tokens CSS via `getComputedStyle` do elemento raiz, em vez de
   fixar hexadecimais - assim o tema claro/escuro de RF10 funciona sem duplicar a
   paleta.
9. Redesenhar em `requestAnimationFrame` a cada mudanca de viewport, tamanho ou
   tema, e observar o redimensionamento com `ResizeObserver` (o painel muda de
   largura ao arrastar o divisor).
10. Substituir o placeholder de `waveform-panel.tsx` mantendo os estados vazios
    ja existentes (sem `.vcd`, orientacao sobre `$dumpfile`/`$dumpvars`).

## Criterios de aceite

- [x] O exemplo do somador desenha os cinco sinais alinhados no tempo.
- [x] Barramentos aparecem como segmentos com valor legivel; segmentos estreitos
      ficam sem texto, sem sobreposicao. **Ressalva**: o valor mostrado e o binario
      literal por bit (conforme o Figma, nao hexadecimal); um barramento largo (ex.:
      o contador de 32 bits do exemplo real) raramente tem segmento largo o
      suficiente para exibir o valor por extenso nesta issue — fica sem texto ate
      RF06-I03/I04 entregarem a leitura pelo cursor.
- [x] `x` e `z` sao distinguiveis de `0` e `1` sem depender so de cor.
- [x] A regua mostra tempos na unidade do `$timescale`.
- [x] Alternar o tema redesenha com as cores corretas, sem recarregar.
- [x] Arrastar o divisor do painel redesenha sem distorcer.
- [x] Em tela de alta densidade as linhas ficam nitidas (validado com devicePixelRatio
      1,25 no navegador; nao testado em hardware com DPR inteiro maior, ex. 2x/3x).
- [x] Nenhuma dependencia de biblioteca de grafico e adicionada.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: simular o exemplo, comparar visualmente com o esperado; alternar tema;
redimensionar a janela e os paineis.

## Riscos

- Ler tokens com `getComputedStyle` a cada frame custa caro: ler uma vez por
  mudanca de tema e guardar em estado.
- Canvas nao e acessivel por si: a coluna de nomes em DOM e a leitura textual de
  RF06-I04 sao o que cobre RNF09. Nao tratar isso aqui e aceitavel, desde que
  RF06-I04 seja feita.

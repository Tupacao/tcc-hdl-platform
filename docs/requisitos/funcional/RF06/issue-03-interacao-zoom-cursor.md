# RF06-I03 - Zoom, deslocamento, selecao de sinais e cursor de tempo

| Campo | Valor |
| --- | --- |
| Feature | [RF06](feature.md) |
| Branch | `feat/rf06-interacao-zoom-cursor` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF06-I02 |

## Contexto

O enunciado de RF06 diz "visualizador grafico **interativo**". Desenhar a onda
inteira em uma tela fixa nao atende: uma simulacao de 1000 ns com transicoes a
cada 1 ns nao cabe em 800 pixels sem perder tudo o que interessa. O que torna a
ferramenta util e conseguir aproximar em um trecho, andar no tempo, escolher
quais sinais olhar e ler o valor exato em um instante.

RF06-I02 ja isola o estado de visualizacao em `viewport`
(`{ startTime, endTime, pixelsPerTime }`); esta issue e quem passa a manipula-lo.

## Objetivo

Tornar o painel navegavel: zoom, deslocamento, selecao de sinais e um cursor que
reporta valores em texto - por mouse e por teclado.

## Escopo tecnico

- `apps/web/src/features/waveform/waveform-canvas.tsx` - eventos e estado.
- `apps/web/src/features/waveform/use-viewport.ts` (novo) - logica do viewport.
- `apps/web/src/features/waveform/signal-list.tsx` (novo) - selecao de sinais.
- `apps/web/src/features/waveform/cursor-readout.tsx` (novo) - leitura de valores.
- `apps/web/src/components/ui/` - `input` e `checkbox` do shadcn/ui, se ainda nao
  existirem.

## Passo a passo

1. Implementar `useViewport` com as operacoes: `zoomAt(time, factor)`,
   `pan(deltaTime)`, `fitAll()` e `setRange(start, end)`. Restringir sempre ao
   intervalo `[0, endTime]` e a um zoom minimo/maximo utilizavel.
2. Mouse: roda com `Ctrl` (ou apenas roda, se nao houver rolagem vertical
   concorrente) aplica zoom no ponto sob o cursor; arrastar com o botao primario
   desloca; arrastar com `Shift` seleciona um intervalo e ajusta o viewport a ele.
3. Teclado, com o canvas focalizavel (`tabIndex={0}`): setas esquerda/direita
   deslocam, `+`/`-` aplicam zoom, `Home`/`End` vao ao inicio/fim, `0` ajusta
   tudo. Documentar os atalhos junto com os de RF09-I02.
4. Cursor de tempo: clicar fixa uma linha vertical; as setas com `Shift` movem o
   cursor de transicao em transicao (nao de pixel em pixel - e o que se quer ao
   inspecionar). Mostrar o instante na regua.
5. Leitura de valores: painel em texto com o nome e o valor de cada sinal
   selecionado no instante do cursor, em binario e hexadecimal. Este painel e
   tambem a versao acessivel do grafico.
6. Selecao de sinais: lista com busca por nome, marcar/desmarcar, "selecionar
   todos" e reordenacao por arrastar (ou por botoes, se arrastar complicar a
   acessibilidade). Persistir a selecao entre execucoes da mesma sessao, casando
   por nome de sinal.
7. Ao receber um `.vcd` novo, preservar selecao e zoom quando os sinais forem os
   mesmos; recomecar com `fitAll()` quando mudarem.
8. Garantir que todos os controles tenham rotulo acessivel e foco visivel.

## Criterios de aceite

- [ ] Zoom com a roda aproxima no ponto sob o cursor, nao no centro.
- [ ] Arrastar desloca o tempo, sem permitir sair do intervalo simulado.
- [ ] O ajuste automatico enquadra toda a simulacao.
- [ ] Clicar fixa o cursor; `Shift` + setas pula de transicao em transicao.
- [ ] A leitura mostra o valor correto de cada sinal no instante do cursor, em
      binario e hexadecimal.
- [ ] A busca filtra a lista de sinais e a selecao altera o desenho.
- [ ] Toda a interacao e possivel apenas pelo teclado.
- [ ] Reexecutar a simulacao com os mesmos sinais preserva selecao e zoom.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: simular o contador de `samples.ts` (ou o exemplo com clock de RF20),
aproximar em uma borda de clock, mover o cursor por transicoes e conferir os
valores contra o `$display` do testbench.

## Riscos

- Zoom e deslocamento com estado em React re-renderizando a cada evento derrubam
  o frame rate; manter o viewport em `useRef` durante o gesto e comitar no estado
  ao final, ou redesenhar direto no `requestAnimationFrame`.
- Arrastar para reordenar sinais e um padrao dificil de tornar acessivel; se o
  custo crescer, entregar reordenacao por botoes "subir"/"descer" e registrar a
  simplificacao.

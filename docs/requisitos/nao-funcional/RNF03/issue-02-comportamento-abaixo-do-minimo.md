# RNF03-I02 - Comportamento abaixo da largura minima

| Campo | Valor |
| --- | --- |
| Feature | [RNF03](feature.md) |
| Branch | `feat/rnf03-comportamento-abaixo-do-minimo` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF03-I01 |

## Contexto

`workspace.tsx` aplica `min-w-[1024px]`. Abaixo disso, a pagina inteira ganha
rolagem horizontal: o layout nao quebra, mas o usuario passa a rolar
lateralmente para alcancar o painel de ondas - e nada explica por que.

O enunciado de RNF03 diz "minima **recomendada**", o que deixa espaco para
decidir. O que nao cabe e o comportamento atual ser acidente em vez de escolha.

Casos reais que caem abaixo do piso: janela nao maximizada, tela dividida entre
duas aplicacoes, projetor em 800x600, tablet em paisagem.

## Objetivo

Definir e implementar um comportamento deliberado abaixo de 1024px, coerente com
a decisao registrada no design.

## Escopo tecnico

- `apps/web/src/features/workspace/workspace.tsx`
- `apps/web/src/hooks/use-viewport-width.ts` (novo), se houver adaptacao
- `apps/web/src/features/workspace/narrow-notice.tsx` (novo), se houver aviso
- `docs/COMPATIBILIDADE.md`

## Passo a passo

1. Implementar a decisao tomada no design de RNF03. As tres opcoes viaveis, em
   ordem crescente de custo:
   - **manter a rolagem horizontal**, acrescentando um aviso dispensavel que
     explique a largura recomendada;
   - **empilhar os paineis** verticalmente, com rolagem vertical;
   - **mostrar um painel por vez**, com abas para alternar entre editor, console
     e ondas.
   Recomendacao para o prazo do TCC: a primeira, com aviso claro. Adaptar o
   layout inteiro tem custo alto para um caso de uso explicitamente fora do alvo.
2. Detectar a largura com `matchMedia('(min-width: 1024px)')` e um listener,
   seguindo o padrao ja usado no `ThemeProvider` para `prefers-color-scheme`.
3. Se houver aviso, torna-lo dispensavel e nao reaparecer na mesma sessao -
   `sessionStorage`, nao `localStorage`: e uma condicao transitoria, ligada ao
   tamanho da janela atual.
4. Garantir que a plataforma continue **funcional** abaixo do piso: nada de
   bloquear o uso. Recomendar nao e impedir.
5. Verificar em 800x600 e em 768px de largura que todo o conteudo continua
   alcancavel, ainda que com rolagem.
6. Conferir que a rolagem horizontal, quando existir, e da pagina e nao de um
   painel interno - rolagem aninhada e a pior experiencia possivel aqui.
7. Documentar o comportamento por faixa de largura em `docs/COMPATIBILIDADE.md`.

## Criterios de aceite

- [ ] O comportamento abaixo de 1024px e o definido no design, e nao acidental.
- [ ] A plataforma continua funcional abaixo do piso.
- [ ] O aviso, se houver, e dispensavel e nao reaparece na sessao.
- [ ] Todo o conteudo e alcancavel em 800px de largura.
- [ ] Nao ha rolagem horizontal aninhada.
- [ ] Voltar acima de 1024px restaura o comportamento normal.
- [ ] O comportamento por faixa esta documentado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: reduzir a janela continuamente de 1920 ate 800, observando as transicoes
nos dois sentidos.

## Riscos

- Bloquear o uso abaixo do piso contraria RF01 e o proprio enunciado, que fala em
  largura recomendada.
- Adaptar o layout inteiro para telas estreitas e a opcao mais cara e a de menor
  retorno no escopo do TCC; se for escolhida, precisa ser decisao consciente com
  prazo reservado.

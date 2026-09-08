# RF12-I04 - Integracao do editor visual no workspace

| Campo | Valor |
| --- | --- |
| Feature | [RF12](feature.md) |
| Branch | `feat/rf12-integracao-workspace` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF12-I03 |

## Contexto

O workspace de RF09 tem tres paineis e ja exige `min-w-[1024px]`. O editor visual
nao cabe como quarto painel: um canvas espremido em 300 pixels e inutil.

A solucao natural e alternar o painel de edicao entre dois modos - codigo ou
circuito - mantendo console e formas de onda no lugar. Isso preserva a promessa
de interface unica de RF09 e da ao canvas a largura de que precisa.

## Objetivo

Integrar o canvas ao workspace com alternancia entre codigo e circuito, sem
perder estado de nenhum dos dois e sem quebrar o fluxo de simulacao.

## Escopo tecnico

- `apps/web/src/features/workspace/workspace.tsx`
- `apps/web/src/features/workspace/editor-mode-switch.tsx` (novo)
- `apps/web/src/features/circuit/circuit-canvas.tsx`
- `apps/web/vite.config.ts` - carregamento sob demanda

## Passo a passo

1. Introduzir `editorMode: 'code' | 'circuit'` no `Workspace` e um alternador
   visivel no cabecalho do painel de edicao.
2. Manter os dois montados quando possivel, escondendo com `hidden` em vez de
   desmontar: remontar o React Flow perde zoom e posicao de rolagem. Se a memoria
   pesar, preservar o estado de visualizacao explicitamente ao desmontar.
3. Carregar o modulo do circuito sob demanda (`React.lazy` + `Suspense`), para
   que quem so usa codigo nao pague o custo do React Flow no carregamento
   inicial (RNF07).
4. Persistir o modo escolhido junto ao layout de RF09-I01, e abrir no modo
   circuito quando o projeto tiver circuito salvo e nao tiver codigo escrito a
   mao.
5. Deixar claro o caminho circuito -> simulacao: no modo circuito, "Executar"
   deve gerar o Verilog (RF13) antes de submeter, ou orientar explicitamente se
   RF13 ainda nao estiver disponivel. Nunca submeter um codigo desatualizado em
   silencio.
6. Manter console e formas de onda funcionando igual nos dois modos - o resultado
   da simulacao e o mesmo.
7. Ajustar a barra de estado de RF09-I03 para refletir tambem os problemas de
   validacao do circuito (RF12-I02).
8. Verificar o comportamento em 1024px: o canvas precisa ser utilizavel, nao
   apenas caber.

## Criterios de aceite

- [ ] O alternador troca entre codigo e circuito sem perder o conteudo de nenhum.
- [ ] O modulo do circuito nao entra no carregamento inicial de quem nao o usa.
- [ ] O modo escolhido e restaurado na proxima sessao.
- [ ] Executar no modo circuito deixa explicito de onde vem o codigo submetido.
- [ ] Console e formas de onda funcionam identicamente nos dois modos.
- [ ] Os problemas de validacao do circuito aparecem na barra de estado.
- [ ] Em 1024px o canvas continua utilizavel.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: alternar varias vezes entre os modos conferindo zoom, posicao e texto;
medir o bundle inicial antes e depois.

## Riscos

- Manter os dois montados dobra a memoria da area de edicao; medir com um
  circuito grande antes de fixar a estrategia.
- Se RF13 nao estiver pronto, o modo circuito vira um brinquedo sem saida.
  Ordenar RF12 e RF13 juntos, ou deixar o botao de executar explicitamente
  indisponivel com a razao visivel.

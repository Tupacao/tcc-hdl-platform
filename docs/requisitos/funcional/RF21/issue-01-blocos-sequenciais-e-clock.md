# RF21-I01 - Blocos sequenciais, clock e validacao com memoria

| Campo | Valor |
| --- | --- |
| Feature | [RF21](feature.md) |
| Branch | `feat/rf21-blocos-sequenciais-e-clock` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF12-I02 |

## Contexto

RF12-I02 estabelece que ciclo no grafo e erro - regra correta para circuitos
combinacionais. Um contador, porem, e literalmente um ciclo: a saida do
flip-flop alimenta a logica que calcula o proximo valor, que volta a entrada do
flip-flop. Introduzir sequenciais significa reescrever essa regra sem afrouxa-la
para o caso combinacional.

Ha tambem o clock, que nao e uma entrada comum: ele nao participa da logica, e
sim define quando o estado muda.

## Objetivo

Acrescentar flip-flop, clock e reset ao canvas, e adaptar a validacao para
aceitar realimentacao atraves de elemento de memoria.

## Escopo tecnico

- `apps/web/src/features/circuit/types.ts` - novos tipos de bloco
- `apps/web/src/features/circuit/blocks/flip-flop.tsx` (novo)
- `apps/web/src/features/circuit/validate.ts` - regra de ciclo
- `apps/web/src/features/circuit/validate.test.ts`
- `packages/shared/src/schemas/circuit.ts` - versao do schema

## Passo a passo

1. Acrescentar a `BlockKind`: `dff` (flip-flop tipo D), `clock` e `reset`. O
   flip-flop tem terminais `d`, `clk`, `rst` e `q`.
2. Implementar o componente do flip-flop conforme o design, com o triangulo de
   borda sensivel no terminal de clock.
3. Tratar clock e reset como fontes de papel proprio: um circuito tem no maximo
   um clock (multiplos dominios estao fora do escopo), e conectar clock a uma
   entrada de dado deve ser recusado.
4. Reescrever a deteccao de ciclo: percorrer o grafo **cortando** as arestas que
   entram em elemento de memoria pelo terminal de dado. Um ciclo no grafo assim
   reduzido continua sendo erro; o que atravessa flip-flop deixa de ser.
5. Acrescentar validacoes proprias de circuito sequencial:
   - flip-flop com `clk` desconectado (erro);
   - flip-flop com `d` desconectado (erro);
   - clock presente sem nenhum flip-flop (aviso);
   - flip-flop presente sem clock conectado (erro);
   - reset desconectado (aviso: sem reset o estado inicial e indefinido).
6. Incrementar a versao de `CircuitSchema` (RF12-I03) e garantir que circuitos
   salvos na versao 1 continuem abrindo.
7. Ampliar os testes de validacao: contador valido (ciclo atraves de flip-flop),
   ciclo puramente combinacional (ainda erro), ciclo misto, flip-flop sem clock,
   dois clocks.
8. Verificar que a paleta e a interacao seguem o mesmo padrao de RF12-I01,
   incluindo o acesso por teclado.

## Criterios de aceite

- [ ] O flip-flop existe na paleta, com os quatro terminais.
- [ ] Clock e reset sao blocos proprios, visualmente distintos.
- [ ] Realimentacao atraves de flip-flop nao e reportada como erro.
- [ ] Realimentacao puramente combinacional continua sendo erro.
- [ ] Flip-flop sem clock ou sem dado gera erro especifico.
- [ ] Um contador de 4 bits montado no canvas passa na validacao.
- [ ] Circuitos salvos na versao anterior do schema continuam abrindo.
- [ ] Cada regra nova tem teste.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: montar um contador de 4 bits; criar um ciclo combinacional e confirmar
que ainda e erro.

## Riscos

- Afrouxar a deteccao de ciclo de forma generica reintroduz o erro que RF12-I02
  evitava: o corte precisa ser exatamente nas arestas de dado que entram em
  memoria, e os testes precisam cobrir o caso combinacional.
- Permitir multiplos clocks abre a porta para dominios distintos, o que exige
  analise que esta fora do escopo; limitar a um clock e uma restricao deliberada
  e deve estar documentada.

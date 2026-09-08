# RF13-I01 - Representacao intermediaria e ordenacao topologica

| Campo | Valor |
| --- | --- |
| Feature | [RF13](feature.md) |
| Branch | `feat/rf13-representacao-intermediaria` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF12-I02 |

## Contexto

O grafo de RF12 e uma estrutura de edicao: blocos com posicao na tela e conexoes
entre terminais. Emitir Verilog direto dessa estrutura mistura duas
preocupacoes - percorrer o grafo e formatar texto - e produz um gerador dificil
de testar.

O passo intermediario resolve: transformar o grafo em uma lista ordenada de
atribuicoes, onde cada valor ja tem nome e cada atribuicao so depende de valores
ja definidos. Depois disso, emitir texto e trivial.

## Objetivo

Produzir uma representacao intermediaria - portas, sinais e atribuicoes em ordem
de dependencia - a partir do grafo validado.

## Escopo tecnico

- `apps/web/src/features/circuit/codegen/ir.ts` (novo)
- `apps/web/src/features/circuit/codegen/ir.test.ts` (novo)
- `apps/web/src/features/circuit/types.ts` - reuso do modelo

## Passo a passo

1. Definir a representacao:
   - `IrPort`: `{ name, direction: 'input' | 'output' }`;
   - `IrSignal`: `{ name }` para os fios internos;
   - `IrAssignment`: `{ target, op, operands }`, onde `op` cobre `and`, `or`,
     `not`, `xor`, `nand`, `nor` e `buffer` (ligacao direta);
   - `IrModule`: `{ name, ports, signals, assignments }`.
2. Exigir grafo valido na entrada: reutilizar a validacao de RF12-I02 e recusar
   gerar quando houver ciclo, entrada solta ou saida sem origem. A funcao devolve
   um resultado discriminado (`ok` / `problemas`), nunca lanca.
3. Nomear sinais:
   - portas usam o rotulo do bloco de entrada/saida, ja validado como
     identificador Verilog em RF12-I02;
   - sinais internos recebem nomes previsiveis e estaveis (`n1`, `n2`, ...) em
     ordem topologica, para que gerar duas vezes o mesmo circuito produza o mesmo
     texto - condicao para o hash de sincronia de RF12-I03 funcionar;
   - garantir que nenhum nome interno colida com nome de porta, acrescentando
     sufixo quando necessario.
4. Ordenar topologicamente (algoritmo de Kahn), partindo das entradas e
   constantes. Como RF12-I02 ja garante ausencia de ciclo, um ciclo detectado
   aqui e erro interno, nao entrada invalida.
5. Tratar os casos de borda:
   - saida ligada diretamente a uma entrada (atribuicao de passagem);
   - saida de um bloco alimentando varias entradas (um sinal, varios usos);
   - bloco isolado, que nao contribui para nenhuma saida - descartar da emissao,
     mantendo o aviso de RF12-I02;
   - constante como operando.
6. Cobrir com testes: somador completo, multiplexador 2:1, inversor simples,
   saida ligada direto a entrada, fan-out, bloco isolado, e a estabilidade dos
   nomes entre duas geracoes do mesmo grafo.

## Criterios de aceite

- [ ] Um somador completo produz a representacao com as portas e atribuicoes
      corretas.
- [ ] As atribuicoes vem em ordem de dependencia.
- [ ] Gerar duas vezes o mesmo grafo produz nomes identicos.
- [ ] Nenhum nome interno colide com nome de porta.
- [ ] Fan-out gera um sinal usado varias vezes, nao sinais duplicados.
- [ ] Grafo invalido devolve a lista de problemas, sem lancar excecao.
- [ ] Blocos isolados nao aparecem na representacao.
- [ ] O modulo nao depende de React nem do React Flow.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

## Riscos

- Nomes instaveis entre geracoes quebram a deteccao de "codigo editado a mao" de
  RF12-I03; a estabilidade e requisito, nao detalhe.
- Assumir que a validacao ja rodou sem verificar produz falha obscura; a funcao
  deve validar de novo, mesmo que barato.

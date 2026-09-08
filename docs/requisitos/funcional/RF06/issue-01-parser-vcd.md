# RF06-I01 - Parser de VCD e modelo de sinais

| Campo | Valor |
| --- | --- |
| Feature | [RF06](feature.md) |
| Branch | `feat/rf06-parser-vcd` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

O `.vcd` chega ao frontend como uma unica string em `result.vcd`. Hoje
`waveform-panel.tsx` so conta ocorrencias de `$var` para estimar a quantidade de
sinais. Antes de desenhar qualquer coisa e preciso um modelo de dados: quais
sinais existem, de que largura, e quando cada um mudou de valor.

O formato VCD tem particularidades que decidem a forma do modelo:

- valores sao registrados **por mudanca**, nao por instante - entre duas
  transicoes o sinal mantem o valor anterior;
- identificadores sao codigos curtos (`!`, `#`, `$`), reaproveitados quando dois
  sinais sao o mesmo `wire` em escopos diferentes;
- escalares aparecem como `0!`, `1!`, `x!`, `z!`; vetores como `b1010 #`;
- reais aparecem como `r3.14 %` (o `iverilog` emite quando ha `real`);
- `$timescale 1ns` define a unidade de tempo, e o eixo precisa dela para rotular.

## Objetivo

Converter o texto VCD em uma estrutura consultavel por tempo, com custo previsivel
e sem depender do renderizador.

## Escopo tecnico

- `apps/web/src/features/waveform/vcd-parser.ts` (novo)
- `apps/web/src/features/waveform/types.ts` (novo)
- `apps/web/src/features/waveform/vcd-parser.test.ts` (novo)

## Passo a passo

1. Definir o modelo:
   - `WaveSignal`: `id`, `name`, `scope` (caminho, ex. `tb.uut`), `width`, `type`.
   - `WaveTransition`: `time: number`, `value: string` (guardar o valor como texto
     na base binaria, para preservar `x`/`z` bit a bit).
   - `Waveform`: `{ timescale, timeUnit, endTime, signals: WaveSignal[], transitions: Map<string, WaveTransition[]> }`.
2. Escrever o parser em uma unica passagem sobre a string, sem `split('\n')` do
   arquivo inteiro quando possivel (varrer por indice reduz o pico de memoria em
   arquivos grandes).
3. Cabecalho: interpretar `$timescale`, empilhar `$scope`/`$upscope` para montar
   o caminho de cada sinal, e registrar `$var <tipo> <largura> <id> <nome> $end`.
   Um mesmo `id` pode ter varios nomes - guardar todos, apontando para a mesma
   serie de transicoes.
4. Corpo: cada linha iniciada por `#` fixa o tempo atual; as demais registram
   valor. Tratar `0/1/x/z/X/Z` para escalares, `b.../B...` para vetores,
   `r.../R...` para reais. Ignorar `$dumpvars`, `$dumpall`, `$end` e comentarios
   sem falhar.
5. Normalizar valores de vetor: o VCD omite zeros a esquerda; preencher ate
   `width` respeitando a regra do formato (estende com `0`, ou com `x`/`z` quando
   o bit mais significativo e `x`/`z`).
6. Tolerar arquivo truncado (RF04-I02): parar no ultimo registro completo e
   sinalizar `truncated: true` no resultado, em vez de lancar excecao.
7. Expor uma funcao `valueAt(signalId, time)` com busca binaria sobre o vetor de
   transicoes - e o que o cursor de RF06-I03 vai usar.
8. Cobrir com testes: o VCD gerado pelo exemplo do somador, vetor com `x`,
   arquivo sem `$timescale`, arquivo truncado no meio de um valor, `$scope`
   aninhado, dois nomes para o mesmo identificador.

## Criterios de aceite

- [ ] O `.vcd` do exemplo `full_adder` produz o conjunto correto de sinais, com
      largura e caminho de escopo corretos.
- [ ] Transicoes ficam ordenadas por tempo e sem duplicidade.
- [ ] `valueAt` devolve o valor vigente em qualquer instante, inclusive antes da
      primeira transicao.
- [ ] Vetores tem os zeros a esquerda restaurados conforme a largura declarada.
- [ ] Arquivo truncado e interpretado ate onde da, com `truncated: true`.
- [ ] O parser nao lanca excecao em nenhuma das fixtures de teste.
- [ ] Nao ha dependencia nova no `package.json` para essa etapa.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Os testes de `apps/web` ainda nao tem runner configurado; ate que exista, manter
o parser como modulo puro (sem React, sem DOM) e valida-lo com o runner de
`apps/api` ou adicionar `node --test` ao `@tplab/web` nesta issue.

## Riscos

- Guardar todas as transicoes em memoria e aceitavel para o teto de VCD definido
  em RF04-I02, mas nao escala indefinidamente; a estrutura precisa deixar espaco
  para amostragem em RF06-I04.
- O parser tem que ser tolerante: VCD invalido nao pode derrubar o workspace
  inteiro. Toda falha vira estado "nao foi possivel interpretar a forma de onda".

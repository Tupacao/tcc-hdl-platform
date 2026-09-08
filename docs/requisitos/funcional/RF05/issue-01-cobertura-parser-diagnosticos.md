# RF05-I01 - Ampliar a cobertura do parser de diagnosticos

| Campo | Valor |
| --- | --- |
| Feature | [RF05](feature.md) |
| Branch | `feat/rf05-cobertura-parser-diagnosticos` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

`parseIcarusDiagnostics` (`apps/api/src/modules/simulation/diagnostics.ts`)
resolve o caso principal: `arquivo:linha:` e `arquivo:linha:coluna:` com prefixos
`error`, `warning`, `sorry` e `internal error`. Duas lacunas conhecidas:

1. **Caminho absoluto.** Dentro do container os arquivos vivem em `/work`, e o
   `iverilog` pode emitir `/work/design.v:12: ...`. O frontend compara
   `diagnostic.file === fileName` em `code-editor.tsx`, onde `fileName` e
   `design.v`. Com o prefixo `/work/`, o marcador nunca e aplicado.
2. **Saida do `vvp`.** Erros de execucao (`$fatal`, acesso invalido, divisao por
   zero) chegam pelo mesmo `stderr` e sao processados pelo mesmo parser, mas o
   `vvp` usa formatos proprios, incluindo mensagens sem localizacao nenhuma.

Ha ainda o ruido: linhas como `2 error(s) during elaboration.` viram
diagnosticos de severidade `error` sem linha, e aparecem no console misturadas
aos erros reais.

## Objetivo

Fazer o parser cobrir a saida real das duas ferramentas, normalizar o nome do
arquivo para o nome submetido pelo usuario e separar resumo de diagnostico.

## Escopo tecnico

- `apps/api/src/modules/simulation/diagnostics.ts`
- `apps/api/src/modules/simulation/diagnostics.test.ts`
- `apps/api/src/worker.ts` - passar os nomes dos arquivos submetidos ao parser.
- `packages/shared/src/schemas/simulation.ts` - eventual campo de origem.

## Passo a passo

1. Coletar saidas reais rodando o sandbox contra codigos deliberadamente
   quebrados: `endmodule` faltando, modulo inexistente instanciado, porta a mais,
   largura incompativel, `$fatal` no testbench, divisao por zero. Salvar as
   saidas como fixtures do teste.
2. Fazer `parseIcarusDiagnostics` receber a lista de nomes de arquivo submetidos
   e normalizar `file`: remover prefixo de diretorio (`/work/`, `./`) e casar com
   o nome conhecido; quando nao casar, manter o valor original.
3. Reconhecer os formatos do `vvp`, incluindo mensagens que citam a linha em
   outro formato, e marcar a origem do diagnostico (`iverilog` ou `vvp`) - util
   para o console distinguir erro de compilacao de erro de execucao.
4. Classificar como resumo (e nao como erro) as linhas do tipo
   `N error(s) during elaboration`, exibindo-as separadamente ou omitindo-as.
5. Tratar `sorry:` como erro, mantendo o comportamento atual, mas com mensagem
   propria: e construcao nao suportada pelo Icarus, nao erro do usuario.
6. Ampliar `diagnostics.test.ts` com um caso por fixture coletada, seguindo o
   padrao existente.

## Criterios de aceite

- [ ] Diagnostico emitido com caminho `/work/design.v` chega ao cliente como
      `design.v` e produz marcador no editor.
- [ ] Erro de execucao do `vvp` aparece no console com a mensagem legivel.
- [ ] `N error(s) during elaboration` nao aparece como um erro na lista.
- [ ] Toda fixture coletada tem teste correspondente.
- [ ] Diagnostico com formato desconhecido continua aparecendo (sem linha), nunca
      e descartado em silencio.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm --filter @tplab/api exec node --import tsx --test src/modules/simulation/diagnostics.test.ts
pnpm typecheck
```

## Riscos

- Descartar linhas desconhecidas esconde erro real do usuario; a regra e sempre
  degradar para "diagnostico sem linha", nunca para "nada".
- A normalizacao de nome de arquivo precisa ser feita no backend, nao no
  frontend: o frontend nao sabe qual foi o workdir do container.

# RNF08-I01 - Generalizacao do job por tipo de toolchain

| Campo | Valor |
| --- | --- |
| Feature | [RNF08](feature.md) |
| Branch | `feat/rnf08-generalizacao-do-job` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF04-I02 |

## Contexto

O pipeline atual tem uma toolchain, e as suposicoes sobre ela estao espalhadas:
`env.SANDBOX_IMAGE` fixo em `sandbox.ts`, `iverilog`/`vvp` no
`run-simulation.sh`, `parseIcarusDiagnostics` no worker, `vcd` como campo do
resultado.

O objetivo nao e abstrair tudo o que pode variar - e tornar o **tipo de job** um
dado, e derivar dele os pontos que dependem da ferramenta.

## Objetivo

Tornar a toolchain um parametro do job, sem alterar o contrato publico das rotas
nem quebrar o fluxo Verilog.

## Escopo tecnico

- `packages/shared/src/schemas/simulation.ts` - tipo de job e artefatos
- `apps/api/src/modules/simulation/toolchains.ts` (novo) - registro
- `apps/api/src/modules/simulation/sandbox.ts` - imagem e artefatos por tipo
- `apps/api/src/worker.ts` - parser por tipo
- `infra/sandbox/` - convencao dos scripts

## Passo a passo

1. Introduzir `JobKind` no contrato (`simulate-verilog` como unico valor
   inicial), com default que preserve o comportamento atual - clientes existentes
   nao precisam mudar.
2. Criar um registro de toolchains: para cada `JobKind`, a imagem Docker, o
   comando do container, o parser de diagnosticos e a lista de artefatos
   esperados. E o unico lugar a tocar para adicionar uma ferramenta.
3. Substituir o campo `vcd: string | null` por uma colecao nomeada de artefatos
   (`artifacts: Record<string, string>`), mantendo `vcd` como campo derivado
   durante a transicao para nao quebrar `WaveformPanel` no mesmo commit.
4. Fazer `runInSandbox` receber a descricao da toolchain em vez de ler
   `env.SANDBOX_IMAGE` diretamente. Manter o valor de ambiente como padrao do
   tipo Verilog.
5. Generalizar a leitura de artefatos: hoje `readVcd` procura qualquer `.vcd`;
   passar a procurar os padroes declarados pela toolchain, aplicando os mesmos
   limites de tamanho de RF04-I02 a cada um.
6. Padronizar os codigos de saida como **contrato de todo script de sandbox**, e
   nao do `run-simulation.sh` especifico: 0 sucesso, 2 erro de compilacao/analise,
   3 erro de execucao, 124 timeout. Documentar em `infra/sandbox/README.md` para
   que a proxima toolchain siga a mesma convencao.
7. Selecionar o parser de diagnosticos pelo tipo de job no worker, em vez de
   chamar `parseIcarusDiagnostics` diretamente.
8. Manter uma unica fila com tipos distintos, e nao uma fila por toolchain: e o
   que preserva o rate limit, a retencao e a observabilidade ja construidos.
9. Atualizar `CLAUDE.md`, que descreve o pipeline e os acoplamentos - se eles
   mudarem, a documentacao passa a mentir.
10. Garantir zero regressao: o fluxo Verilog completo precisa funcionar
    identicamente ao fim da issue.

## Criterios de aceite

- [ ] `JobKind` faz parte do contrato, com default compativel.
- [ ] O registro de toolchains e o unico lugar com detalhe especifico de
      ferramenta.
- [ ] `runInSandbox` nao le a imagem do ambiente diretamente.
- [ ] Artefatos sao colecao nomeada, com limites de tamanho aplicados.
- [ ] O parser e selecionado pelo tipo de job.
- [ ] A convencao de codigos de saida esta documentada em `infra/sandbox/`.
- [ ] O fluxo Verilog funciona identicamente, com o mesmo resultado.
- [ ] `CLAUDE.md` reflete o pipeline atualizado.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api test
pnpm typecheck
pnpm sandbox:build
```

Manual: executar os exemplos de RF20 e comparar o resultado com o anterior.

## Riscos

- Generalizar sem um segundo caso concreto produz a abstracao errada; RNF08-I02
  existe para validar, e as duas issues deveriam ser feitas em sequencia proxima.
- Trocar `vcd` por artefatos nomeados toca o frontend (RF06); manter o campo
  derivado durante a transicao evita quebrar as duas pontas no mesmo commit.
- Multiplicar filas por toolchain duplicaria rate limit, retencao e metricas -
  manter fila unica e uma decisao consciente.

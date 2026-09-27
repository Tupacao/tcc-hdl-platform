# RF03-I04 - Logs estruturados e metricas do worker

| Campo | Valor |
| --- | --- |
| Feature | [RF03](feature.md) |
| Branch | `feat-RF03-04-observabilidade-worker-back` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

Hoje o worker se comunica por `console.log` e `console.error`
(`apps/api/src/worker.ts`): uma linha ao subir e uma linha por falha. Nao ha
registro de quanto tempo cada simulacao levou, qual foi o motivo da falha, nem
quantos jobs passaram pela fila. Sem esses numeros nao e possivel sustentar
RNF07 ("menos de cinco segundos") no texto do TCC, nem dimensionar os limites de
RF03-I02 e RF03-I03.

A API usa o logger do Fastify (pino); o worker nao usa logger nenhum.

## Objetivo

Dar ao worker o mesmo padrao de log estruturado da API e expor um conjunto minimo
de contadores que sustente as afirmacoes de desempenho do trabalho.

## Escopo tecnico

- `apps/api/src/lib/logger.ts` (novo) - instancia pino compartilhada.
- `apps/api/src/worker.ts` - logger e eventos do ciclo de vida do job.
- `apps/api/src/app.ts` - reutilizar a mesma instancia.
- `apps/api/src/modules/simulation/sandbox.ts` - tempos parciais no `SandboxOutcome`.
- `apps/api/src/modules/health/routes.ts` - endpoint de metricas.

## Passo a passo

1. Criar `lib/logger.ts` exportando uma instancia pino configurada pelo
   `NODE_ENV`, e usar tanto em `buildApp` (via `loggerInstance`) quanto no worker.
2. Registrar, por job, uma linha estruturada com: `jobId`, `durationMs`,
   `failure`, `exitCode`, tamanho do `.vcd`, tamanho dos fontes e tempo de espera
   na fila (`job.processedOn - job.timestamp`).
3. Instrumentar `runInSandbox` para separar os tempos de criacao do container,
   execucao e leitura dos artefatos - o overhead do Docker e o principal suspeito
   investigado em RNF07-I02.
4. Manter contadores em memoria no processo do worker (total, sucesso, falha por
   tipo, duracao acumulada) e publicar em `GET /health/metrics` como JSON simples.
   Nao introduzir Prometheus: fora do escopo e do orcamento da VM.
5. Como API e worker sao processos distintos, os contadores do worker precisam
   ser lidos de algum lugar compartilhado; usar chaves simples no proprio Redis
   (`INCR`/`INCRBYFLOAT`) e ler no endpoint, em vez de abrir uma porta no worker.
6. Cobrir com teste o mapeamento de `SandboxOutcome` para o registro emitido,
   sem depender do Docker.
7. Documentar no `README.md` como coletar os numeros para o capitulo de
   resultados do TCC.

## Criterios de aceite

- [x] Cada job concluido emite exatamente uma linha JSON com os campos acima.
      _(verificado ao vivo: `{"jobId":"78","durationMs":2373,"failure":null,
      "exitCode":0,"vcdBytes":711,"sourceBytes":722,"queueWaitMs":3,
      "timings":{...},"msg":"job de simulacao concluido"}`)_
- [x] `GET /health/metrics` devolve total de jobs, taxa de falha por tipo e
      duracao media. _(verificado ao vivo contra o Redis real deste ambiente —
      `{"totalJobs":1,"succeededJobs":1,"failedJobs":0,"failuresByType":{},
      "averageDurationMs":2373}` apos uma simulacao real)_
- [x] Os tempos parciais do sandbox aparecem no log e somam aproximadamente o
      `durationMs` total. _(medido: 1383+984+4=2371 vs durationMs 2373 — a
      diferenca de 2ms e escrita dos fontes + limpeza do container/workdir,
      fora dos tres tempos medidos)_
- [x] Nenhum trecho de codigo do usuario aparece nos logs - apenas tamanhos.
      _(`buildJobLogRecord` so calcula `.length`, nunca repassa `content`;
      testado em `job-log.test.ts`)_
- [x] `pnpm --filter @tplab/api test` cobre a montagem do registro de log.
      _(`job-log.test.ts` — mapeamento `SandboxOutcome`+metadados do job para
      o registro, sem Docker; `metrics.test.ts` — parsing do hash do Redis)_

## Nota de implementacao

`GET /health/metrics` nao ficou em `modules/health/routes.ts` (caminho do
escopo tecnico original) porque o modulo `health` ja tinha sido migrado para
`application/domain/infra` antes desta issue chegar nele — a rota entrou em
`application/health/controller/health.controller.ts`, seguindo o layout atual
do `ARCHITECTURE.md`.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
pnpm dev:worker   # observar a saida durante uma simulacao
curl -s http://localhost:3333/health/metrics
```

## Riscos

- Logar o codigo submetido viola a privacidade do usuario e infla o disco da VM:
  registrar apenas metadados e tamanhos.
- Contadores zerados a cada restart precisam ser explicitados na documentacao,
  para nao virarem conclusao errada no TCC.

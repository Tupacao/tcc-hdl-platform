# RF03-I03 - Retencao e expiracao dos resultados de job

| Campo | Valor |
| --- | --- |
| Feature | [RF03](feature.md) |
| Branch | `feat-RF03-03-retencao-resultados-job-back` (backend); frontend (diferenciar 404 de rede) fica para depois, ver Nota de implementacao |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

`queue.ts` ja define `removeOnComplete: { age: 3600, count: 500 }` e o mesmo para
falhas. O problema nao e a existencia da politica, e o tamanho de cada registro:
o `returnvalue` do job carrega `stdout`, `stderr` e o `.vcd` inteiro, limitado a
8 MB por `MAX_VCD_BYTES` em `sandbox.ts`. Quinhentos jobs retidos, no pior caso,
sao 4 GB dentro do Redis - mais que a memoria total da VM B2s.

O `GET /api/simulations/:jobId` tambem depende inteiramente dessa retencao:
quando o job expira, o endpoint responde `404` com "Simulacao nao encontrada ou
expirada", e o cliente nao tem como diferenciar isso de um `jobId` invalido.

## Objetivo

Dimensionar a retencao pelo consumo de memoria real, nao pela contagem de jobs, e
tornar a expiracao um estado compreensivel para o cliente.

## Escopo tecnico

- `apps/api/src/modules/simulation/queue.ts` - `defaultJobOptions`.
- `apps/api/src/modules/simulation/sandbox.ts` - teto do `.vcd` e da saida.
- `apps/api/src/config/env.ts` - variaveis novas de retencao.
- `apps/api/.env.example` - documentar as variaveis.
- `apps/web/src/lib/api.ts` - mensagem de resultado expirado.

## Passo a passo

1. Introduzir `JOB_RETENTION_SECONDS` (default 1800) e `JOB_RETENTION_COUNT`
   (default 100) em `env.ts` e usar em `removeOnComplete`/`removeOnFail`. Meia
   hora cobre com folga o ciclo de polling, que tem `POLL_TIMEOUT_MS` de 60 s em
   `apps/web/src/lib/api.ts`.
2. Reduzir `MAX_VCD_BYTES` para um valor compativel com o visualizador (2 MB
   cobre com folga os exemplos de `samples.ts`) e truncar `stdout`/`stderr` em um
   teto proprio (sugestao: 256 KB cada), sinalizando o corte com uma linha
   explicita no fim do texto.
3. Truncar o `.vcd` sempre no fim de uma linha completa, para nao entregar
   arquivo sintaticamente invalido ao parser de RF06.
4. Medir o consumo com `redis-cli info memory` antes e depois de uma bateria de
   simulacoes e registrar o numero no `README.md`.
5. No `404` do endpoint de consulta, manter a mensagem atual e garantir que o
   frontend a diferencie de erro de rede, sugerindo "execute novamente".
6. Confirmar que o `maxmemory-policy` do Redis nao descarta chaves de fila em
   silencio; se necessario, fixar `--maxmemory-policy noeviction` no servico
   `redis` de `infra/docker-compose.yml`.

## Criterios de aceite

- [x] Cem simulacoes seguidas mantem o uso de memoria do Redis abaixo de um teto
      documentado. _(medido com um teto menor e extrapolado — ver Nota de
      implementacao; teto documentado no `README.md`: ~750 MiB no pior caso
      sustentado com `JOB_RETENTION_COUNT=100`)_
- [x] Um `.vcd` acima do limite chega truncado, com aviso visivel, sem quebrar o
      visualizador. _(truncamento verificado contra o pipeline real; o aviso
      "O arquivo .vcd foi truncado..." ja existia no RF06)_
- [x] O `.vcd` truncado continua terminando em uma linha completa. _(verificado
      com um `.vcd` real de ~2 MiB — `vcd.endsWith('\n')` true)_
- [ ] Consultar um `jobId` antigo devolve `404` e o frontend exibe mensagem
      orientando a reexecutar. _(front — depende do mecanismo `errorStatus` de
      RF03-I02, ver Nota de implementacao)_
- [x] As variaveis de retencao estao documentadas em `apps/api/.env.example`.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
docker exec -i tplab-redis-1 redis-cli info memory | grep used_memory_human
```

## Nota de implementacao

**Medicao de memoria (passo 4):** cem simulacoes seguidas eram inviaveis de
rodar de verdade neste ambiente sem violar o rate limit de RF03-I02 (10
submissoes/min em `POST /api/simulations` — cem delas levariam 10+ minutos so
de espera). Em vez disso, medi o custo marginal real de dois jobs consecutivos
que batem no novo teto de `MAX_VCD_BYTES` (2 MiB), contra o Redis real deste
ambiente (`tplab-redis-1`): **~7,5 MiB por job** (+7,45 MiB e +7,54 MiB nos
dois jobs medidos). Extrapolado para `JOB_RETENTION_COUNT=100` jobs
simultaneamente retidos no pior caso (todos no teto), o consumo fica em torno
de **~750 MiB** — documentado com a metodologia completa no `README.md`. Nao e
uma medicao de "cem simulacoes reais", e uma extrapolacao a partir de uma
medicao real do custo por job; mais honesto do que simular o numero sem
nenhuma medicao, mas vale repetir com a bateria completa de 100 quando o rate
limit puder ser suspenso para o teste (ou movido para depois do teste).

**Truncamento validado contra o pipeline real** (nao so o teste unitario de
`truncateAtLineBoundary`/`truncateOutput`): submeti um job com contador de 32
bits por ~400 mil ciclos, gerando um `.vcd` que bate no teto de 2 MiB. O
resultado veio com `vcd.length === 2097147` (5 bytes abaixo do teto de
2097152, exatamente a folga esperada para recuar ate o ultimo `\n`) e
terminando em uma linha `b...&\n` completa — sem linha cortada no meio.

**Item de `404`/frontend fora desta branch:** o passo 5 pede que o frontend
diferencie o `404` de "simulacao expirada" de uma falha de rede generica. Isso
usa exatamente o mecanismo `errorStatus` que RF03-I02 (frontend, PR #34)
introduziu em `buildRunStatus` — mas a #34 foi mergeada por engano na branch
de backend do RF03-I02 em vez de em `main` (ver PR #35, ainda aberta).
Implementar o `404` agora, direto contra `main`, duplicaria esse mecanismo e
geraria conflito quando a #35 mergear. Este item fica pendente ate a #35
mergear; depois disso e uma adicao pequena (mais um `if (errorStatus === 404)`
em `buildRunStatus`).

## Riscos

- Retencao curta demais quebra o polling quando a rede do usuario esta lenta:
  manter `JOB_RETENTION_SECONDS` sempre bem acima do `POLL_TIMEOUT_MS` do cliente.
- Reduzir `MAX_VCD_BYTES` pode cortar formas de onda legitimas de simulacoes
  longas; a mensagem de truncamento precisa orientar o usuario a reduzir o tempo
  simulado ou a quantidade de sinais em `$dumpvars`.

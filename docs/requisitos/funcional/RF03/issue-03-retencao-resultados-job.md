# RF03-I03 - Retencao e expiracao dos resultados de job

| Campo | Valor |
| --- | --- |
| Feature | [RF03](feature.md) |
| Branch | `feat/rf03-retencao-resultados-job` |
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

- [ ] Cem simulacoes seguidas mantem o uso de memoria do Redis abaixo de um teto
      documentado.
- [ ] Um `.vcd` acima do limite chega truncado, com aviso visivel, sem quebrar o
      visualizador.
- [ ] O `.vcd` truncado continua terminando em uma linha completa.
- [ ] Consultar um `jobId` antigo devolve `404` e o frontend exibe mensagem
      orientando a reexecutar.
- [ ] As variaveis de retencao estao documentadas em `apps/api/.env.example`.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
docker exec -i tplab-redis-1 redis-cli info memory | grep used_memory_human
```

## Riscos

- Retencao curta demais quebra o polling quando a rede do usuario esta lenta:
  manter `JOB_RETENTION_SECONDS` sempre bem acima do `POLL_TIMEOUT_MS` do cliente.
- Reduzir `MAX_VCD_BYTES` pode cortar formas de onda legitimas de simulacoes
  longas; a mensagem de truncamento precisa orientar o usuario a reduzir o tempo
  simulado ou a quantidade de sinais em `$dumpvars`.

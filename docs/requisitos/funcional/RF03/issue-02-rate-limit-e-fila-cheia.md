# RF03-I02 - Rate limit dedicado e tratamento de fila saturada

| Campo | Valor |
| --- | --- |
| Feature | [RF03](feature.md) |
| Branch | `feat-RF03-02-rate-limit-e-fila-cheia-back` (backend); frontend em branch separada, ver nota abaixo |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF03-I01 |

## Contexto

`apps/api/src/app.ts` registra `@fastify/rate-limit` de forma global com
`{ max: 60, timeWindow: '1 minute' }`. Esse limite trata todas as rotas por igual:
listar projetos custa microssegundos, enfileirar uma simulacao custa um container
inteiro. Sessenta simulacoes por minuto vindas de uma unica origem saturam a VM
B2s, que roda o worker com `concurrency: 2`.

Alem disso, nao existe hoje nenhuma nocao de "fila cheia": submissoes continuam
sendo aceitas indefinidamente e o usuario fica em polling sem saber que ha
dezenas de jobs na frente do dele. Numa turma inteira clicando "Executar" ao
mesmo tempo, esse e o cenario real.

## Objetivo

Proteger o pipeline de compilacao de rajadas, dando ao usuario uma resposta
honesta quando o limite e atingido: `429` com tempo de espera, e um estado
explicito de fila congestionada em vez de espera silenciosa.

## Escopo tecnico

- `apps/api/src/app.ts` - rate limit global mantido, sem cobrir simulacao.
- `apps/api/src/modules/simulation/routes.ts` - `config.rateLimit` por rota.
- `apps/api/src/modules/simulation/queue.ts` - consulta de profundidade da fila.
- `packages/shared/src/schemas/simulation.ts` - campo de posicao na fila.
- `apps/web/src/lib/api.ts` e `features/workspace/workspace.tsx` - tratamento do
  `429` e exibicao da espera.

## Passo a passo

1. Manter o rate limit global (leitura barata) e adicionar, em
   `POST /api/simulations`, um limite proprio via
   `config: { rateLimit: { max, timeWindow } }`. Dimensionar em torno de 10
   submissoes por minuto por origem: suficiente para o ciclo de tentativa e erro
   de um aluno, insuficiente para script.
2. Garantir que a resposta `429` siga `ApiErrorSchema` (o plugin devolve corpo
   proprio por padrao; sobrescrever com `errorResponseBuilder`) e inclua o
   cabecalho `Retry-After`.
3. Antes de enfileirar, consultar `simulationQueue.getWaitingCount()`. Acima de
   um teto configuravel (`MAX_QUEUE_DEPTH`, default sugerido 50), responder `503`
   com mensagem de plataforma ocupada, em vez de aceitar um job que vai demorar.
4. Adicionar `queuePosition: z.number().int().nonnegative().nullable()` ao
   `SimulationResultSchema` e preencher em `GET /api/simulations/:jobId` enquanto
   o status for `queued`, usando o estado do job e a contagem de espera.
5. Depois de editar o schema, rodar `pnpm --filter @tplab/shared build`: api e web
   consomem o `dist/`, nao o fonte.
6. No frontend, diferenciar as tres situacoes no toast e no console: limite
   atingido (`429`), plataforma ocupada (`503`) e falha de rede.
7. Quando houver `queuePosition`, mostrar "na fila (posicao N)" no lugar de
   "Compilando e simulando...".

## Criterios de aceite

- [x] Onze submissoes seguidas da mesma origem em um minuto: a decima primeira
      retorna `429` com `Retry-After` e corpo no formato `ApiErrorSchema`. _(back)_
- [x] Listar projetos continua funcionando normalmente apos o `429` de simulacao. _(back)_
- [x] Com a fila acima do teto, novas submissoes retornam `503` com mensagem
      distinta da mensagem de "Redis indisponivel". _(back — verificado por
      leitura de codigo; nao ha como simular fila cheia sem Redis real neste
      ambiente, ver Verificacao abaixo)_
- [ ] Enquanto o job esta `queued`, o resultado traz `queuePosition` e a
      interface mostra a posicao. _(backend calcula e devolve `queuePosition`;
      falta a interface mostrar "na fila (posicao N)")_
- [x] Nenhum job entra na fila quando a submissao e recusada. _(back — tanto o
      429 quanto o 503 de fila cheia retornam antes de `simulationQueue.add`)_

## Nota de implementacao

Divida em duas branches (`docs/ARCHITECTURE.md` — front e back nunca
compartilham branch): `feat-RF03-02-rate-limit-e-fila-cheia-back` cobre tudo
de `apps/api` e `packages/shared` listado no escopo tecnico; a mudanca de
`apps/web/src/lib/api.ts` e `features/workspace/workspace.tsx` (passo 6 e 7 do
passo a passo — diferenciar 429/503/rede no toast e mostrar "na fila (posicao
N)") fica para uma branch de frontend separada.

O rate limit de 11 submissoes foi testado enviando corpos invalidos
propositalmente (`topModule` vazio) — o hook de `@fastify/rate-limit` roda em
`onRequest`, antes da validacao do corpo, entao o teto e contado do mesmo jeito
sem precisar de uma submissao valida (que exigiria Redis real, indisponivel
neste ambiente de teste). O caso de fila cheia (`getWaitingCount() >=
SIMULATION_MAX_QUEUE_DEPTH`) nao tem teste automatizado pelo mesmo motivo —
verificado por leitura de codigo; a verificacao manual com Redis real (rajada
de `curl`, sugerida abaixo) fica pendente para quando o ambiente tiver Redis
no ar.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api test
pnpm typecheck
```

Rajada manual, com a API no ar e um corpo valido salvo em `sample-request.json`:

```bash
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3333/api/simulations \
    -H "Content-Type: application/json" --data @sample-request.json
done
```

## Riscos

- Atras de proxy reverso, `@fastify/rate-limit` conta o IP do proxy e limita a
  turma inteira como se fosse um unico usuario: habilitar `trustProxy` no Fastify
  junto com o deploy (RF01-I02).
- Teto de fila baixo demais transforma pico normal de aula em erro; comecar
  generoso e ajustar com os dados coletados em RF03-I04.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Monorepo pnpm do TPLab, plataforma web educacional para HDL (TCC).
Requisitos, decisoes de stack e o significado dos IDs `RF*`/`RNF*` citados no codigo
estao em `docs/PROJECT_CONTEXT.md` — consulte antes de introduzir dependencias ou
mudar arquitetura. `README.md` traz o passo a passo de setup e o estado atual
(feito / pendente).

## Antes de implementar qualquer coisa

1. `docs/ARCHITECTURE.md` — estrutura obrigatoria de pastas (feature-based no
   front, camadas `application/domain/infra` no back) e convencao de branch/commit.
2. `docs/WORKFLOW.md` — processo fixo a seguir: criar branch no padrao > consultar
   a arquitetura > implementar a funcionalidade **por completo** > validar/corrigir
   > so entao escrever os testes (espelhando a arvore, nunca antes da
   > implementacao estar correta) > commit/PR.

Essas duas leituras vem antes de qualquer edicao de codigo nesta tarefa.

## Comandos

```bash
pnpm install
pnpm dev                 # compila @tplab/shared e sobe web (5173) + api (3333)
pnpm dev:worker          # worker da fila, em outro terminal
pnpm typecheck           # tipos de todo o monorepo
pnpm build
pnpm format              # prettier (nao ha ESLint; `pnpm lint` e no-op hoje)
pnpm sandbox:build       # imagem tplab-sandbox:latest (iverilog)
pnpm infra:up            # postgres + redis + api + worker via docker compose
```

Testes (`node:test` + tsx, apenas em `apps/api`):

```bash
pnpm --filter @tplab/api test
# arquivo unico
pnpm --filter @tplab/api exec node --import tsx --test src/tests/simulation/diagnostics-icarus.test.ts
# um teste pelo nome
pnpm --filter @tplab/api exec node --import tsx --test --test-name-pattern="warnings" src/tests/simulation/diagnostics-icarus.test.ts
```

Para trabalhar de verdade e preciso: Redis no ar (sem ele `POST /api/simulations`
responde 503), imagem `tplab-sandbox:latest` construida e o worker rodando.

CI (`.github/workflows/ci-front.yml` e `ci-back.yml`) roda format check, typecheck
e build/test, cada um disparando so quando o respectivo `apps/*` muda. `main` e
protegida: todo codigo entra via PR com CI verde.

## Arquitetura

### Contratos compartilhados

`packages/shared` e a **unica** fonte dos contratos de API. Toda rota do Fastify
declara `body`/`params`/`response` com os schemas Zod de la (via
`fastify-type-provider-zod` + `app.withTypeProvider<ZodTypeProvider>()`), e o
frontend valida a resposta com o mesmo schema em `apps/web/src/lib/api.ts`. Nao
duplicar tipos: derive com `z.infer`.

`@tplab/shared` e consumido pelo `dist/`, nao pelo fonte. Depois de editar um
schema, rode `pnpm --filter @tplab/shared build` (ou deixe `pnpm dev` rodando, que
mantem o `tsc --watch`), senao api e web continuam vendo o contrato antigo.

### Pipeline de simulacao

Compilacao/simulacao nunca roda no processo da API:

1. `POST /api/simulations` (`application/simulation/controller/simulation.controller.ts`)
   valida com `CompileRequestSchema`; o `DefaultSimulationService`
   (`application/simulation/service/simulation.service.ts`) checa a profundidade da fila,
   enfileira pelo `BullMqSimulationJobRepository` e a rota responde `202` com o `jobId`.
2. `apps/api/src/worker.ts` (processo separado, `concurrency: 2`) so consome a fila: o
   pipeline do job vive em `application/simulation/service/simulation-run.service.ts`, que
   chama `runInSandbox`.
3. `infra/sandbox/sandbox.ts` grava os fontes num tmpdir, cria um container
   efemero (`NetworkMode: none`, rootfs somente leitura, `CapDrop: ALL`,
   `no-new-privileges`, memoria/CPU/PIDs limitados, timeout duro) e le stdout,
   stderr e o `.vcd` do workdir (RNF04/RNF05).
4. `application/simulation/service/diagnostics-icarus.ts` converte o stderr do `iverilog` em
   diagnosticos com arquivo/linha/coluna (RF05).
5. O tipo do job (`kind`, default `simulate-verilog`) escolhe a toolchain no registro
   `application/simulation/service/toolchains.ts` (imagem, parser de diagnosticos,
   artefatos; o contrato `Toolchain` fica em `domain/simulation/entities/`); o worker e
   `runInSandbox` nao conhecem a ferramenta. Artefatos voltam em `artifacts` (por nome) e `vcd`
   e derivado de `artifacts.vcd`. Convencao dos scripts: `infra/sandbox/README.md`.
6. O frontend faz polling em `GET /api/simulations/:jobId` (`runSimulation` em
   `lib/api.ts`); o `.vcd` volta como string e alimenta o visualizador (RF06).

Acoplamentos que quebram em silencio se alterados de um lado so:

- **Codigos de saida**: `infra/sandbox/run-simulation.sh` define 0/2/3/4/124/137/153 (4 =
  timeout da compilacao; 137 = SIGKILL antes do limite; 153 = arquivo acima de 16 MiB); o `mapFailure` em `infra/sandbox/sandbox.ts` (os valores em
  `domain/simulation/enums/exit-code.ts`)
  traduz para `SimulationFailure`, e **memoria so e `memory_limit` se o `OOMKilled` do
  Docker confirmar** (137 sozinho vira `internal_error`). Mudar um exige mudar o outro.
- **Opcoes do container**: `buildSandboxContainerOptions` (`infra/sandbox/sandbox.ts`) e a politica do
  proxy do socket do Docker (`infra/docker-proxy/policy.mjs`) precisam aceitar exatamente as
  mesmas opcoes — o proxy recusa qualquer `create` diferente. Mudar um exige mudar o outro
  (`docker-proxy.test.ts` reprova se divergirem). O worker nao monta o socket: fala com o
  proxy por `DOCKER_HOST`.
- **Estados do job**: `toJobStatus` (`application/simulation/repository/bullmq-simulation-job.repository.ts`)
  mapeia os estados do BullMQ para o `JobStatusSchema` publico. Unico ponto da API que
  conhece BullMQ — acima dele o job e um `SimulationJobSnapshot` de `domain/`.
- **Formato dos logs**: sem TTY o Docker multiplexa stdout/stderr; `demuxDockerLogs`
  desfaz os frames de 8 bytes.
- O `run-simulation.sh` roda `iverilog` **sem** `-s`, deixando a toolchain eleger o
  testbench como topo; `topModule` do request e informativo.

A fila e **unica**, com jobs de tipos distintos (preserva rate limit, retencao e metricas):
GHDL (VHDL) e Yosys entram como novo `JobKind` + entrada em `TOOLCHAINS`, sem mudar a API
(RNF08).

### Persistencia

`domain/projects/repositories/project.repository.ts` define a interface
`ProjectRepository`; `application/projects/repository/` traz duas
implementacoes — `InMemoryProjectRepository` (dev sem Postgres) e
`PrismaProjectRepository` (RF07-I01). `app.ts` escolhe uma das duas por
`DATABASE_URL` (obrigatoria quando `NODE_ENV=production`) e injeta no
`ProjectService` (`application/projects/service/`), que o controller
(`application/projects/controller/project.controller.ts`) usa — nunca o
repository diretamente. Schema e migracoes do Prisma ficam em
`apps/api/prisma/`. `projects` foi o primeiro modulo migrado para o layout
`application/domain/infra` de `ARCHITECTURE.md`, e `simulation` seguiu o mesmo
caminho (contratos em `domain/simulation/`, regra em `application/simulation/`,
Docker e fila em `infra/`); `health` ja nasceu em `application/` sem `domain/`
completo. A pasta `modules/*` nao existe mais.

`feedback` (RF17) segue o mesmo desenho: `POST /api/feedback` publico, com dois
limites deliberadamente diferentes — rajada de 20/hora por IP no
`@fastify/rate-limit` (conta requisicoes, inclusive invalidas) e o limite diario
de `FEEDBACK_MAX_PER_DAY` no service, **por sessao anonima** (conta relatos
gravados, e e o numero que o usuario le; decisao de design: um laboratorio atras
do mesmo IP nao divide a cota). Sem sessao, a cota cai para o IP. IP e sessao so
sao gravados como hash com sal (`ipHash`, `limitKey`); nunca em claro, nunca em
log. Nao existe rota de leitura — o procedimento de consulta
esta no `README.md`.

### Frontend

`apps/web/src/features/workspace/` concentra a interface unica do RF09 (editor +
console + waveform em `react-resizable-panels`); o estado da simulacao vive no
`Workspace` e desce por props. O Monaco e carregado do bundle local
(`lib/monaco.ts`), nao do CDN, e o Vite isola `monaco-editor` num chunk proprio.
Em desenvolvimento o Vite faz proxy de `/api` para `localhost:3333`, entao nao ha CORS.

## Convencoes

- TypeScript estrito, ESM, `verbatimModuleSyntax` e `noUncheckedIndexedAccess`.
- `apps/api` e `packages/shared` usam `moduleResolution: NodeNext` — imports
  relativos **precisam** da extensao `.js`. `apps/web` usa Bundler e o alias `@/*`
  para `src/`.
- UI: apenas shadcn/ui (style `new-york`, `components.json`) + Tailwind v4 via
  `@tailwindcss/vite`. Nao introduzir MUI, Chakra ou outra lib de componentes.
- Cores sempre pelos tokens de tema (`bg-background`, `text-muted-foreground`, ...),
  para manter contraste AA nos modos claro e escuro (RF10/RNF09).
- Comentarios e textos de interface em portugues, com acentuacao correta.
  Testado neste ambiente (Write/Edit + PowerShell) e o arquivo grava e le UTF-8
  sem corromper — a regra antiga de "sem acentuacao" foi revertida por pedido
  explicito do usuario (o texto sem acento estava sendo lido como erro de
  portugues). Comentarios e textos ja existentes nao precisam ser reescritos
  so por causa disso; a regra vale para texto novo ou tocado a partir de agora.
- Textos visiveis ao usuario (interface, documentacao, mensagens da API/validacao) usam o
  vocabulario de `docs/GLOSSARIO.md` (circuito, testbench, modulo principal, simular, Executar,
  forma de onda, erro/aviso, Problemas, Console) — consultar antes de escrever texto novo.
- Prettier: aspas simples, ponto e virgula, `printWidth` 100, LF. `.sh` e Dockerfile
  sao forcados a LF pelo `.gitattributes` (rodam em container Linux).

## Ferramentas do agente

Tudo abaixo e escopado a este repositorio — nada foi instalado globalmente.

- **Skills** em `.claude/skills/` (versionadas): `a11y-audit`, `docker-development`,
  `senior-frontend` e `senior-backend`, copiadas do repositorio MIT
  `alirezarezvani/claude-skills`. Ver `.claude/skills/NOTICE.md` para origem e
  criterio de escolha. Os `scripts/*.py` delas **nao rodam** sem Python instalado;
  as instrucoes e os `references/*.md` funcionam normalmente.
- **MCP** `chrome-devtools` em `.mcp.json` (versionado, sem segredo): inspeciona o
  app em `localhost:5173`, le console, tira screenshots e mede performance.
- **MCP** `github` em `.mcp.json` (`@modelcontextprotocol/server-github` via `npx`):
  consulta e opera o repositorio `https://github.com/Tupacao/tcc-hdl-platform`
  (branches, PRs, labels, reviewers, issues, status de CI) sem depender do `gh`
  CLI. O servidor remoto oficial (`api.githubcopilot.com`) nao autentica neste
  ambiente (nao suporta dynamic client registration), entao usamos este servidor
  local com PAT. O token fica em `GITHUB_PERSONAL_ACCESS_TOKEN` no ambiente do
  shell (nunca no `.mcp.json`, que so referencia `${GITHUB_PERSONAL_ACCESS_TOKEN}`).
  Este servidor roda via `npx` (processo Node): matar processos `node` na maquina
  (ex.: `taskkill /F /IM node.exe`, ou equivalente para liberar uma porta) derruba
  o MCP para o resto da sessao — preferir localizar e encerrar o PID especifico
  (`netstat -ano` + `taskkill /F /PID <pid>`) a matar todos os processos `node`.
  Se o MCP cair e o `gh` CLI nao estiver instalado, criar/gerenciar PR direto pela
  API REST do GitHub com `curl`, usando o mesmo `GITHUB_PERSONAL_ACCESS_TOKEN`
  do ambiente (`Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN`) — cobre
  `POST /repos/:owner/:repo/pulls`, labels (`POST .../issues/:n/labels`) e
  reviewers (`POST .../pulls/:n/requested_reviewers`; falha com 422 se o PAT for
  do proprio autor do PR, que e o caso aqui — `Tupacao` nao pode se auto-revisar).
- **MCP** `context7` (documentacao atualizada das libs — o stack usa React 19,
  Tailwind v4, Zod 4, Fastify 5) fica em escopo `local`, fora do repositorio,
  porque carrega uma API key. `.mcp.json` nao expande variavel vinda de
  `settings.json`, so do ambiente do shell.
- **rtk** (`~/.local/bin/rtk.exe`, instalacao global da maquina) comprime a saida de
  comandos antes de virar contexto. Filtros uteis aqui: `rtk pnpm`, `rtk tsc`,
  `rtk test`, `rtk docker`, `rtk git`, `rtk format` e `rtk prisma`.

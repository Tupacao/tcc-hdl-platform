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
   implementacao estar correta) > commit/PR.

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
pnpm --filter @tplab/api exec node --import tsx --test src/modules/simulation/diagnostics.test.ts
# um teste pelo nome
pnpm --filter @tplab/api exec node --import tsx --test --test-name-pattern="warnings" src/modules/simulation/diagnostics.test.ts
```

Para trabalhar de verdade e preciso: Redis no ar (sem ele `POST /api/simulations`
responde 503), imagem `tplab-sandbox:latest` construida e o worker rodando.

CI (`.github/workflows/ci-front.yml` e `ci-back.yml`) roda format check + typecheck
+ build/test, cada um disparando so quando o respectivo `apps/*` muda. `main` e
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

1. `POST /api/simulations` (`modules/simulation/routes.ts`) valida com
   `CompileRequestSchema`, enfileira no BullMQ e responde `202` com o `jobId`.
2. `apps/api/src/worker.ts` (processo separado, `concurrency: 2`) consome a fila e
   chama `runInSandbox`.
3. `modules/simulation/sandbox.ts` grava os fontes num tmpdir, cria um container
   efemero (`NetworkMode: none`, rootfs somente leitura, `CapDrop: ALL`,
   `no-new-privileges`, memoria/CPU/PIDs limitados, timeout duro) e le stdout,
   stderr e o `.vcd` do workdir (RNF04/RNF05).
4. `modules/simulation/diagnostics.ts` converte o stderr do `iverilog` em
   diagnosticos com arquivo/linha/coluna (RF05).
5. O frontend faz polling em `GET /api/simulations/:jobId` (`runSimulation` em
   `lib/api.ts`); o `.vcd` volta como string e alimenta o visualizador (RF06).

Acoplamentos que quebram em silencio se alterados de um lado so:

- **Codigos de saida**: `infra/sandbox/run-simulation.sh` define 0/2/3/124; o
  `mapFailure` em `sandbox.ts` traduz para `SimulationFailure`. Mudar um exige mudar o outro.
- **Estados do job**: `toJobStatus` mapeia os estados do BullMQ para o
  `JobStatusSchema` publico.
- **Formato dos logs**: sem TTY o Docker multiplexa stdout/stderr; `demuxDockerLogs`
  desfaz os frames de 8 bytes.
- O `run-simulation.sh` roda `iverilog` **sem** `-s`, deixando a toolchain eleger o
  testbench como topo; `topModule` do request e informativo.

A fila e por tipo de job: GHDL (VHDL) e Yosys entram como novos jobs, sem mudar a
API (RNF08).

### Persistencia

`modules/projects/repository.ts` define a interface `ProjectRepository` e uma
implementacao em memoria, injetavel via options do plugin de rotas. A troca por
Prisma/PostgreSQL nao deve tocar as rotas. Hoje os dados somem a cada restart.

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
- Comentarios e textos de interface em portugues, sem acentuacao em arquivos de
  codigo para evitar problemas de encoding no Windows.
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
- **MCP** `context7` (documentacao atualizada das libs — o stack usa React 19,
  Tailwind v4, Zod 4, Fastify 5) fica em escopo `local`, fora do repositorio,
  porque carrega uma API key. `.mcp.json` nao expande variavel vinda de
  `settings.json`, so do ambiente do shell.
- **rtk** (`~/.local/bin/rtk.exe`, instalacao global da maquina) comprime a saida de
  comandos antes de virar contexto. Filtros uteis aqui: `rtk pnpm`, `rtk tsc`,
  `rtk test`, `rtk docker`, `rtk git`, `rtk format` e `rtk prisma`.

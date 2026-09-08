# Plataforma Web Educacional para HDL

Ambiente de desenvolvimento e simulacao de circuitos digitais em Verilog que roda
inteiramente no navegador, sem instalacao local (RF01). Editor, compilador,
simulador e visualizador de formas de onda ficam em uma unica interface (RF09).

Os requisitos completos estao em [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).

## Stack

| Camada       | Tecnologias                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Frontend     | React 19 + Vite + TypeScript, Tailwind CSS v4, shadcn/ui, Monaco Editor, react-resizable-panels, sonner |
| Backend      | Node.js + Fastify + TypeScript, Zod (`fastify-type-provider-zod`), BullMQ + Redis                       |
| Execucao HDL | Icarus Verilog (`iverilog` + `vvp`) em container Docker efemero, via dockerode                          |
| Dados        | PostgreSQL, Redis                                                                                       |

## Estrutura

```
apps/
  web/      Frontend React + Vite
  api/      API Fastify + worker da fila de simulacao
packages/
  shared/   Schemas Zod e tipos compartilhados entre web e api
infra/
  docker-compose.yml   Postgres, Redis, api, worker
  sandbox/             Imagem Docker do sandbox de execucao (iverilog)
docs/
```

## Requisitos

- Node.js >= 22
- pnpm >= 10 (`npm i -g pnpm`)
- Docker (Postgres, Redis e o sandbox de execucao)

## Como rodar

```bash
pnpm install

# 1. Infraestrutura (Postgres + Redis)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 2. Imagem do sandbox de simulacao
pnpm sandbox:build

# 3. Variaveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Aplicacoes (web + api em paralelo)
pnpm dev

# 5. Worker de simulacao, em outro terminal
pnpm dev:worker
```

- Frontend: http://localhost:5173
- API: http://localhost:3333 (`GET /health`)

O Vite faz proxy de `/api` para a API, entao nao ha CORS no desenvolvimento.

## Scripts

| Comando                             | Descricao                                     |
| ----------------------------------- | --------------------------------------------- |
| `pnpm dev`                          | Compila `@hdl/shared` e sobe web + api        |
| `pnpm dev:worker`                   | Worker que consome a fila e executa o sandbox |
| `pnpm build`                        | Build de todos os pacotes                     |
| `pnpm typecheck`                    | Verificacao de tipos em todo o monorepo       |
| `pnpm test` (em `apps/api`)         | Testes do parser de diagnosticos              |
| `pnpm infra:up` / `pnpm infra:down` | Stack Docker completa                         |
| `pnpm sandbox:build`                | Constroi a imagem `hdl-sandbox:latest`        |

## Fluxo de uma simulacao

1. O frontend envia `POST /api/simulations` com o design e o testbench, validados
   pelo `CompileRequestSchema` de `packages/shared`.
2. A API enfileira o job no BullMQ e responde `202` com o `jobId`.
3. O worker cria um container efemero (`--network=none`, 128 MB, 0.5 CPU,
   rootfs somente leitura, timeout de 10 s) que roda `iverilog` e `vvp` (RNF04/RNF05).
4. A saida do `iverilog` e convertida em diagnosticos com numero de linha (RF05) e
   o `.vcd` gerado volta para o visualizador de formas de onda (RF06).
5. O frontend acompanha o job por polling em `GET /api/simulations/:jobId`.

> Codigo submetido pelo usuario **nunca** e executado no processo da API — sempre
> pelo caminho `runInSandbox`.

## Estado atual e proximos passos

Ja implementado neste setup inicial:

- Monorepo pnpm com contratos Zod compartilhados
- API Fastify com `/health`, CRUD de projetos e endpoints de simulacao
- Worker BullMQ + runner do sandbox Docker + parser de diagnosticos (com testes)
- Frontend com editor Monaco (Verilog), painies redimensionaveis, console de erros e
  tema claro/escuro

Pendente:

- [ ] Persistencia real dos projetos (Prisma + PostgreSQL) — hoje o repositorio e em
      memoria (`apps/api/src/modules/projects/repository.ts`)
- [ ] Renderizacao grafica do `.vcd` no `WaveformPanel` (RF06)
- [ ] Exportacao de projetos em `.zip` (RF08)
- [ ] Documentacao estatica: guia de inicio rapido e referencia de sintaxe (RF11)
- [ ] Autenticacao Google e compartilhamento por link (RF14/RF15)
- [ ] Editor visual de circuitos com React Flow (RF12/RF13)

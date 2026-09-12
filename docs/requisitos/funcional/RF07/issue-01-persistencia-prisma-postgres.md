# RF07-I01 - Persistencia com Prisma e PostgreSQL

| Campo | Valor |
| --- | --- |
| Feature | [RF07](feature.md) |
| Branch | `feat-RF07-01-persistencia-prisma-postgres-back` (padrao de `docs/WORKFLOW.md`, nao o sugerido acima) |
| Tamanho | G (aprox. 2 dias) |
| Depende de | - |

## Contexto

`apps/api/src/modules/projects/repository.ts` define a interface
`ProjectRepository` e uma implementacao em memoria. As rotas recebem o
repositorio por options (`projectRoutes(app, { repository })`), com o `InMemory`
como default. Essa indirecao foi criada exatamente para esta issue: trocar a
implementacao sem tocar em `routes.ts`.

O Postgres ja sobe em `infra/docker-compose.yml` e a API ja recebe `DATABASE_URL`,
declarada como opcional em `apps/api/src/config/env.ts`. Nao ha ORM instalado nem
schema de banco.

## Objetivo

Entregar uma implementacao de `ProjectRepository` sobre PostgreSQL, sem alterar
as rotas nem o contrato publico da API.

## Escopo tecnico

Ver "Notas de implementacao" abaixo para o layout final (migrado para
`application/domain/infra` por decisao explicita, diferente do previsto aqui):

- `apps/api/prisma/schema.prisma` + `migrations/` (novo)
- `apps/api/src/infra/prisma/client.ts` (novo) - cliente unico
- `apps/api/src/domain/projects/{repositories,services}/` (novo) - interfaces
- `apps/api/src/application/projects/{repository,service,controller}/` (novo)
- `apps/api/src/app.ts` - escolha do repositorio por ambiente
- `apps/api/src/config/env.ts` - `DATABASE_URL` obrigatoria em producao
- `apps/api/package.json`, `apps/api/Dockerfile`, `infra/docker-compose.yml`,
  `.dockerignore` (novo), `.github/workflows/ci-back.yml`, `pnpm-workspace.yaml`
  (`allowBuilds` do prisma)

## Passo a passo

1. Instalar `prisma` (dev) e `@prisma/client` em `apps/api`.
2. Modelar `Project` mapeando o `ProjectSchema` de `packages/shared`:
   `id` (uuid), `name`, `description` (nullable), `sources` (`Json`),
   `createdAt`, `updatedAt`. Guardar `sources` como JSON e nao em tabelas
   separadas: o formato ja e validado por Zod na borda e nao ha consulta por
   campo interno.
3. Deixar o modelo preparado para RF14/RNF06 desde ja - uma coluna `ownerId`
   nullable com indice - sem implementar autorizacao nesta issue. Adicionar
   coluna depois com dados em producao custa mais que prever agora.
4. Implementar `PrismaProjectRepository` cumprindo a interface, com a mesma
   ordenacao (`updatedAt` decrescente) e a mesma semantica de `update` parcial:
   `description` explicitamente `null` limpa o campo, `undefined` preserva.
5. Validar com `ProjectSchema.parse` o que sai do banco antes de devolver - o
   `Json` do Prisma e `unknown` do ponto de vista do contrato.
6. Selecionar a implementacao no bootstrap: com `DATABASE_URL` presente, Prisma;
   sem ela, `InMemory` com aviso no log. Em `NODE_ENV=production`, exigir a
   variavel e falhar no boot se faltar.
7. Criar a migracao inicial (`prisma migrate dev`) e documentar o comando de
   producao (`prisma migrate deploy`), incluindo-o no `Dockerfile` ou no entrypoint
   do servico `api`.
8. Escrever testes do repositorio cobrindo os cinco metodos. Se rodar contra
   Postgres real complicar o CI, testar o contrato com a suite aplicada as duas
   implementacoes - o mesmo teste que passa em memoria precisa passar no Prisma.
9. Atualizar `README.md`: comandos de migracao e a nota de que os dados deixaram
   de ser efemeros.

## Criterios de aceite

- [x] ~~`apps/api/src/modules/projects/routes.ts` nao foi modificado.~~ Ver nota
      de implementacao: o modulo inteiro migrou para `application/domain/infra`;
      o contrato HTTP (rotas, schemas, comportamento) nao mudou.
- [x] Criar um projeto, reiniciar a API e o projeto continuar existindo.
- [x] `PATCH` parcial preserva os campos nao enviados e limpa `description` com
      `null` explicito.
- [x] A lista vem ordenada por `updatedAt` decrescente.
- [x] Sem `DATABASE_URL` a API sobe em memoria com aviso; em producao, falha.
- [x] A migracao roda em banco limpo, do zero.
- [x] A mesma suite de contrato passa nas duas implementacoes.

### Notas de implementacao (desvios do passo a passo)

- **Escopo tecnico maior que o previsto.** `docs/ARCHITECTURE.md` define que
  tocar um modulo antigo (`modules/*`) inclui migra-lo para o layout
  `application/domain/infra` como parte da tarefa, nao como efeito colateral a
  evitar — e esta e a primeira issue a tocar `modules/projects/` desde que esse
  padrao foi escrito. Optei por migrar (decisao do usuario, apresentada como
  pergunta antes de comecar) em vez de so trocar a implementacao do repository
  dentro da pasta antiga. Layout final:
  - `domain/projects/{repositories,services}/` — interfaces (`ProjectRepository`, `ProjectService`).
  - `application/projects/{repository,service,controller}/` — `InMemoryProjectRepository`,
    `PrismaProjectRepository`, `DefaultProjectService` (repasse direto — RF07 nao
    tem regra de negocio alem do CRUD) e o controller Fastify (`project.controller.ts`,
    renomeado de `routes.ts`, mesmas rotas/schemas).
  - `infra/prisma/client.ts` — singleton preguicoso do `PrismaClient`.
  - `apps/api/prisma/schema.prisma` + `migrations/` — convencao do proprio Prisma CLI.
  - `apps/api/src/tests/projects/` — suite de contrato (`project-repository.contract.ts`)
    aplicada a `InMemoryProjectRepository` e a `PrismaProjectRepository`.
- **`.dockerignore` criado** (nao existia): sem ele, `docker build` do
  `apps/api/Dockerfile` falhava ao enviar o contexto (symlinks de
  `node_modules` do pnpm quebram o `tar` do BuildKit no Windows) e, pior,
  copiava `apps/api/.env` local para dentro da imagem. Exclui `node_modules`,
  `dist`, `.git`, `apps/web`, `infra/sandbox` e todo `.env*` (exceto
  `.env.example`).
- **`Dockerfile`**: `pnpm install --frozen-lockfile=false` ja nao era aceito
  pela versao de pnpm do projeto (erro de parsing de flag) — trocado por
  `--no-frozen-lockfile`. Bug preexistente, descoberto so agora porque esta foi
  a primeira vez que o Dockerfile foi de fato construido nesta maquina.
  Adicionado tambem: `apk add openssl` (exigido pelo engine do Prisma em
  Alpine), `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` no
  `schema.prisma`, `prisma generate` no estagio de build, e `CMD` do runtime
  rodando `npx prisma migrate deploy` antes do `node dist/server.js` — so o
  servico `api` roda migracao (o `worker` sobrescreve o `CMD` no
  `docker-compose.yml`, sem corrida).
- **CI** (`ci-back.yml`): adicionado servico `postgres:17-alpine` + passo de
  `prisma migrate deploy` antes dos testes, para que a suite de contrato rode
  de verdade contra Postgres em todo PR, nao so localmente.
- Validado manualmente: `pnpm --filter @tplab/api test` (19/19, incluindo a
  suite de contrato contra Postgres real via `docker compose up -d postgres`);
  `docker build -f apps/api/Dockerfile .` e execucao do container contra um
  Postgres descartavel do zero (migracao aplicada no start, CRUD completo via
  `curl`); fallback em memoria e falha de boot em producao sem `DATABASE_URL`
  testados manualmente com o servidor local.

## Verificacao

```bash
docker compose -f infra/docker-compose.yml up -d postgres
pnpm --filter @tplab/api exec prisma migrate dev
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- `sources` como `Json` nao tem validacao no banco: dado gravado por versao
  antiga do schema pode falhar no `parse` da leitura. Tratar a falha devolvendo
  erro claro, nao `500` generico.
- Rodar `migrate deploy` no start de dois containers (api e worker) ao mesmo
  tempo cria corrida; rodar a migracao apenas no servico `api`.
- Prisma pesa no tamanho da imagem e no tempo de build; conferir que o
  `Dockerfile` gera o client na etapa correta.

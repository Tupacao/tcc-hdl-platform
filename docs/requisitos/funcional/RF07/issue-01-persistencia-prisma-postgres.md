# RF07-I01 - Persistencia com Prisma e PostgreSQL

| Campo | Valor |
| --- | --- |
| Feature | [RF07](feature.md) |
| Branch | `feat/rf07-persistencia-prisma-postgres` |
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

- `apps/api/prisma/schema.prisma` (novo)
- `apps/api/src/lib/prisma.ts` (novo) - cliente unico
- `apps/api/src/modules/projects/prisma-repository.ts` (novo)
- `apps/api/src/modules/projects/repository.ts` - inalterado, exceto tipos
- `apps/api/src/server.ts` e `app.ts` - escolha do repositorio por ambiente
- `apps/api/src/config/env.ts` - `DATABASE_URL` obrigatoria em producao
- `apps/api/package.json`, `apps/api/Dockerfile`, `infra/docker-compose.yml`

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

- [ ] `apps/api/src/modules/projects/routes.ts` nao foi modificado.
- [ ] Criar um projeto, reiniciar a API e o projeto continuar existindo.
- [ ] `PATCH` parcial preserva os campos nao enviados e limpa `description` com
      `null` explicito.
- [ ] A lista vem ordenada por `updatedAt` decrescente.
- [ ] Sem `DATABASE_URL` a API sobe em memoria com aviso; em producao, falha.
- [ ] A migracao roda em banco limpo, do zero.
- [ ] A mesma suite de contrato passa nas duas implementacoes.

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

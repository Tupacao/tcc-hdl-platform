# RF07 - Criar, listar, abrir, renomear e excluir projetos

| Campo | Valor |
| --- | --- |
| ID | RF07 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Gestao de projetos |
| Status | Parcial (API existe em memoria; nao ha interface) |
| Requisitos relacionados | RF08, RF09, RF14, RF15, RNF06 |

## 1. Enunciado

> O usuario deve poder criar, listar, abrir, renomear e excluir seus projetos.

## 2. O que e

E a camada que transforma o TPLab de um bloco de rascunho em um lugar onde o
trabalho fica guardado. Um projeto e a unidade que o usuario reconhece: um nome,
uma descricao opcional e o par design/testbench (`HdlSourcesSchema`).

O contrato REST ja esta definido e implementado em
`apps/api/src/modules/projects/routes.ts`:

| Verbo | Rota | Uso |
| --- | --- | --- |
| GET | `/api/projects` | listar |
| GET | `/api/projects/:id` | abrir |
| POST | `/api/projects` | criar |
| PATCH | `/api/projects/:id` | renomear, editar descricao, salvar codigo |
| DELETE | `/api/projects/:id` | excluir |

O que falta e o que sustenta as duas pontas: persistencia real (hoje os dados
somem a cada restart) e interface (hoje nao existe nenhuma tela de projeto - o
`Workspace` sempre abre com `SAMPLE_SOURCES`).

## 3. Para que serve

Sem persistencia, todo trabalho do aluno vive enquanto a aba estiver aberta. Isso
inviabiliza o uso real: a atividade de laboratorio dura mais de uma sessao, o
aluno troca de maquina, o navegador fecha. Guardar projeto tambem e o que permite
retomar de onde parou - o comportamento que qualquer pessoa espera de uma
ferramenta de trabalho.

E, na cadeia de requisitos, RF07 e o pre-requisito de RF08 (exportar o que existe)
e de RF15 (compartilhar o que existe).

## 4. Impacto

**Para o usuario.** Deixa de perder trabalho. Ganha a nocao de "meus projetos",
que e o modelo mental de EDA Playground e CircuitVerse.

**Na arquitetura.** `repository.ts` ja define a interface `ProjectRepository` e
uma implementacao em memoria, injetavel pelas options do plugin de rotas. Essa
indirecao existe justamente para que a troca por Prisma/PostgreSQL nao toque as
rotas. Trocar a implementacao e um exercicio contido; nao respeitar a interface e
o que quebraria o desenho.

**Na seguranca.** Hoje `GET /api/projects` lista os projetos de todo mundo, sem
nocao de dono. Isso e aceitavel enquanto os dados sao efemeros e a plataforma nao
esta publicada; deixa de ser no momento em que RF01-I02 coloca a API na internet.
RF14 (login Google) e RNF06 (autorizacao) sao a continuacao obrigatoria - e essa
dependencia precisa estar explicita, nao subentendida.

**Na experiencia.** Introduz a pergunta "o que acontece com o que eu digitei?".
Salvar automaticamente, avisar sobre alteracoes nao salvas e restaurar a ultima
sessao sao decisoes de produto que aparecem so aqui.

## 5. Estado atual no repositorio

- `packages/shared/src/schemas/project.ts`: `ProjectSchema`,
  `CreateProjectSchema`, `UpdateProjectSchema` (parcial, com refinamento que exige
  ao menos um campo), `ProjectListSchema` e `ProjectIdParamsSchema`.
- `apps/api/src/modules/projects/routes.ts`: os cinco endpoints, tipados com
  `ZodTypeProvider`, com `404` padronizado em `ApiErrorSchema`.
- `apps/api/src/modules/projects/repository.ts`: interface + `InMemoryProjectRepository`
  (Map, ordenacao por `updatedAt` decrescente, `randomUUID` como id).
- `infra/docker-compose.yml` ja sobe `postgres:17-alpine` e a API recebe
  `DATABASE_URL`; `env.ts` declara a variavel como opcional.
- Nao ha ORM instalado, nao ha schema de banco e nao ha migracao.
- Nao ha nenhuma tela de projeto no frontend, nem chamada a `/api/projects` em
  `apps/web/src/lib/api.ts`.
- **Falta**: implementacao Prisma, interface de gerenciamento e o vinculo entre o
  workspace e o projeto aberto.

## 6. Escopo

**Dentro**

- Persistencia em PostgreSQL via Prisma, atras da interface `ProjectRepository`.
- Migracao inicial e execucao no ambiente da VM.
- Interface: listar, criar, abrir, renomear, editar descricao e excluir.
- Vinculo entre o `Workspace` e o projeto aberto, com estado de alteracoes nao
  salvas.

**Fora**

- Autenticacao e escopo por usuario (RF14/RNF06) - RF07 entrega a estrutura; a
  posse do projeto vem depois.
- Historico de versoes e desfazer exclusao.
- Pastas, etiquetas ou busca avancada.
- Compartilhamento (RF15) e exportacao (RF08).

## 7. Criterios de aceite da feature

- [ ] Criar um projeto, reiniciar a API e o projeto continuar la.
- [ ] A lista mostra nome, descricao e data de atualizacao, ordenada pela mais
      recente.
- [ ] Abrir um projeto carrega design e testbench no editor.
- [ ] Renomear reflete na lista sem recarregar a pagina.
- [ ] Excluir pede confirmacao e remove da lista.
- [ ] Editar o codigo e salvar atualiza o projeto e o `updatedAt`.
- [ ] Sair com alteracoes nao salvas gera aviso.
- [ ] As rotas continuam identicas - a troca de repositorio nao mudou o contrato.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-persistencia-prisma-postgres.md) | Persistencia com Prisma e PostgreSQL | `feat/rf07-persistencia-prisma-postgres` | G |
| [issue-02](issue-02-interface-gerenciamento-projetos.md) | Interface de gerenciamento de projetos | `feat/rf07-interface-gerenciamento-projetos` | G |
| [issue-03](issue-03-vinculo-workspace-projeto.md) | Vinculo do workspace com o projeto aberto | `feat/rf07-vinculo-workspace-projeto` | M |

## 9. Dependencias

- Depende do Postgres no ar (`pnpm infra:up`).
- Bloqueia RF08 (exportar), RF15 (compartilhar) e a persistencia prometida por
  RF14.
- Exige RNF06 antes de a plataforma ir a publico com dados reais.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

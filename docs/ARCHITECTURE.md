# Arquitetura — TPLab

> Documento normativo. Toda implementação (humana ou assistida por IA) deve seguir
> esta estrutura. Mudanças aqui exigem atualização deste arquivo antes (ou junto)
> do código que as motivou. Ver também `docs/WORKFLOW.md` para o processo de
> implementação passo a passo e `PROJECT_CONTEXT.md` para stack e requisitos (RF/RNF).

---

## 1. Frontend — arquitetura por features

Cada feature (tela ou funcionalidade) vive em `apps/web/src/features/<nome-da-feature>/`
e segue sempre a mesma estrutura interna:

```
nome-da-feature/
  __tests__/          # espelha index, components/ e utils/ — hooks NAO sao testados
  hooks/               # hooks React que fazem chamadas de API — so isso
  utils/               # funcoes puras, constantes e todo texto de interface
  components/          # componentes React da feature
  styles/
    components/        # estilos especificos de cada componente
  models/              # interfaces/tipos da feature
  index.tsx            # opcional — ponto de entrada da feature, quando aplicavel
```

### Regras por pasta

- **`utils/`** — qualquer logica sem renderizacao React: formatacao, calculo,
  validacao, ordenacao, e **todo** texto fixo de interface (labels, mensagens,
  placeholders). Nao existe string literal solta dentro de um componente.
- **`models/`** — apenas interfaces/tipos. Sem logica, sem valores default
  complexos.
- **`hooks/`** — exclusivamente hooks de integracao com API (chamadas HTTP,
  polling, mutation). Um hook que so filtra/ordena/deriva dados sem chamar API
  nao e um hook — e uma funcao de `utils/`.
- **`components/`** — componentes React puros da feature. Componentes
  reutilizaveis entre features vao para `apps/web/src/components/ui` (shadcn) ou
  um `apps/web/src/components/shared` caso a duplicacao apareca em 3+ features.
- **`styles/`** — arquivos de estilizacao da feature; `styles/components/` espelha
  `components/` quando um componente precisa de estilo dedicado alem das classes
  Tailwind inline.
- **`__tests__/`** — espelha a arvore de `index`, `components/` e `utils/`.
  `hooks/` fica fora do escopo de teste (mock de API tem baixo valor aqui).

---

## 2. Backend — arquitetura em camadas por feature

```
apps/api/src/
  application/
    nome-da-feature/
      controller/        # entrada HTTP (rotas Fastify), orquestra a chamada ao service
      service/            # implementacao da regra de negocio (implementa interface de domain)
      repository/         # implementacao de acesso a dados (implementa interface de domain)

  domain/
    nome-da-feature/
      entities/
      dtos/
      enums/
      repositories/       # interfaces (contratos)
      services/           # interfaces (contratos)
      mappers/            # entity <-> DTO

  infra/
    # conectividade com banco (Prisma/PostgreSQL), migrations, filas (BullMQ/Redis),
    # sandbox Docker — tudo que e detalhe de infraestrutura, sem regra de negocio

  tests/
    # espelha SOMENTE application/ — e a unica camada com codigo executavel de regra de negocio
```

### Principios

- **`domain/`** define contratos puros (interfaces/tipos), sem nenhuma
  implementacao e sem dependencia de framework (Fastify, Prisma, etc).
- **`application/`** implementa os contratos de `domain/` para a feature
  correspondente. `controller` nunca acessa `repository` diretamente — sempre via
  `service`.
- **`infra/`** nao contem regra de negocio; apenas conecta `application/` a
  recursos externos (DB, fila, containers).
- **`tests/`** espelha `application/` 1:1 (mesmo caminho relativo), porque e onde
  vive toda a logica executavel. `domain/` (so tipos) e `infra/` (so
  conectividade) nao precisam de espelho de teste dedicado.
- Isso convive com o padrao ja existente do projeto descrito em `CLAUDE.md`
  (ex.: `ProjectRepository` em `modules/projects/repository.ts`) — ao tocar um
  modulo antigo, migrar sua pasta para o padrao acima faz parte da tarefa, nao
  um efeito colateral a evitar.

---

## 3. Git — branches e commits

### Protecao de branch

`main` **bloqueada** para push direto. Todo codigo entra via Pull Request,
revisado e com CI verde.

### Nomenclatura de branch

```
feat-RNXX-NumeroIssue-NomeDaIssue-front
feat-RNXX-NumeroIssue-NomeDaIssue-back
fix-NomeDoBug-front
fix-NomeDoBug-back
```

- `RNXX` e o ID do requisito (`RF*`/`RNF*`) quando a branch implementa um, definido
  em `docs/requisitos/`.
- Front e back **nunca** sao alterados na mesma branch. Se uma mudanca exige os
  dois lados, sao duas branches e dois PRs separados.

### Nomenclatura de commit

Commits agrupados por sentido logico (nunca um commit por save), usando prefixo:

| Prefixo     | Uso                                                    |
| ----------- | ------------------------------------------------------- |
| `feat:`     | funcionalidade nova                                    |
| `fix:`      | correcao de bug                                        |
| `update:`   | atualizacao de algo existente                          |
| `refac:`    | refatoracao sem mudanca de comportamento                |
| `style:`    | formatacao que nao altera comportamento                |
| `prettier:` | lint/formatacao automatica                             |

---

## 4. CI/CD

Pipelines separados por app em `.github/workflows/`, cada um disparando apenas
quando ha mudanca no diretorio correspondente:

- **`ci-front.yml`** — `apps/web`, `packages/shared`: typecheck, build e testes
  (quando existirem) do front.
- **`ci-back.yml`** — `apps/api`, `packages/shared`: typecheck e testes
  (`node:test`) do back.

Ambos rodam `format:check` (Prettier) e sao o gate minimo de PR: nao garantem
cobertura nem fazem deploy, apenas confirmam que a aplicacao nao quebra antes do
merge. Ver os arquivos em `.github/workflows/` para o detalhe de cada job.

---

## 5. Divergencias conhecidas

Este documento e a fonte da verdade para codigo novo. Codigo existente que ainda
nao segue o padrao (ex.: rotas atuais de `apps/api/src/modules/*` fora do layout
`application/domain/infra`) deve ser migrado a medida que for tocado — nao exige
uma migracao em massa antecipada. Ver `docs/WORKFLOW.md` sobre quando migrar
versus quando so adicionar por cima.

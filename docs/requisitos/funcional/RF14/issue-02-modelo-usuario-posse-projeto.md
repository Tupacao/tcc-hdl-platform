# RF14-I02 - Modelo de usuario e posse dos projetos

| Campo | Valor |
| --- | --- |
| Feature | [RF14](feature.md) |
| Branch | `feat/rf14-modelo-usuario-posse-projeto` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF14-I01 |

## Contexto

RF07-I01 ja previu uma coluna `ownerId` nullable no modelo `Project`,
antecipando esta issue. Falta a outra ponta: o modelo `User`, o vinculo entre
conta Google e usuario da plataforma, e a decisao sobre o que acontece com os
projetos que existem sem dono.

`ProjectRepository` e a interface que todas as rotas usam. Filtrar por dono muda
a assinatura desses metodos - e a unica mudanca estrutural desta issue.

## Objetivo

Modelar o usuario, vincular projetos ao dono e preparar o repositorio para operar
por escopo de usuario, sem ainda impor a autorizacao.

## Escopo tecnico

- `apps/api/prisma/schema.prisma` - modelo `User` e relacao
- `packages/shared/src/schemas/user.ts` (novo)
- `apps/api/src/modules/projects/repository.ts` - assinatura com escopo
- `apps/api/src/modules/projects/prisma-repository.ts`
- `apps/api/src/modules/auth/` - criacao do usuario no callback

## Passo a passo

1. Modelar `User`: `id`, `provider` (`google`), `providerId`, `email`, `name`,
   `avatarUrl`, `createdAt`, `lastLoginAt`. Indice unico em
   `(provider, providerId)` - e a chave estavel, nao o e-mail, que pode mudar.
2. Definir `UserSchema` (publico) em `packages/shared`, expondo apenas o
   necessario ao frontend: `id`, `name`, `avatarUrl` e, se justificavel, `email`.
   Rodar `pnpm --filter @tplab/shared build`.
3. No callback de RF14-I01, aplicar upsert por `(provider, providerId)`,
   atualizando nome, avatar e `lastLoginAt` a cada entrada.
4. Adicionar a relacao `Project.ownerId -> User.id`, nullable, com indice, e
   `onDelete` definido conscientemente. Recomendacao: `SetNull` para nao apagar
   trabalho por acidente ao remover uma conta.
5. Estender a interface `ProjectRepository` com um escopo de dono explicito -
   por exemplo `list(ownerId: string | null)` e `findById(id, ownerId)`. Escopo
   explicito no tipo e o que impede esquecer o filtro em uma rota nova.
6. Definir o comportamento do usuario anonimo. Recomendacao: projetos sem dono
   continuam existindo e visiveis apenas enquanto nao houver autenticacao no
   ambiente; com login disponivel, criar projeto exige conta, e o trabalho
   anonimo vive em rascunho local (RF07-I03) ate o usuario entrar.
7. Registrar a decisao sobre os projetos orfaos existentes: migracao os apaga,
   preserva sem dono, ou os deixa acessiveis por link? Escrever a escolha no
   `README.md`.
8. Migracao Prisma que cria `User`, adiciona a relacao e preserva os dados
   existentes.
9. Testar o repositorio com escopo: usuario A nao ve projeto de B ao listar.

## Criterios de aceite

- [ ] `User` existe, com unicidade por `(provider, providerId)`.
- [ ] Entrar duas vezes com a mesma conta nao cria dois usuarios.
- [ ] Projetos criados com sessao ativa recebem `ownerId`.
- [ ] A interface do repositorio exige o escopo de dono no tipo.
- [ ] Listar como usuario A nao traz projetos de B.
- [ ] A migracao roda sobre banco com dados sem perder projetos.
- [ ] O `UserSchema` publico nao expoe dado desnecessario.
- [ ] O comportamento dos projetos orfaos esta documentado.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api exec prisma migrate dev
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- Usar o e-mail como chave do usuario quebra quando a pessoa troca o e-mail da
  conta Google; a chave e o `providerId`.
- Escopo de dono opcional na assinatura convida ao esquecimento; deixar
  obrigatorio, mesmo que o valor possa ser `null`.
- Esta issue prepara a autorizacao mas nao a impoe: sem RNF06, conhecer o id
  ainda permite acessar projeto alheio. Isso precisa estar explicito no
  `README.md` ate RNF06 entrar.

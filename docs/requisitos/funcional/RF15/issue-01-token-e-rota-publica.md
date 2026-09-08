# RF15-I01 - Token de compartilhamento e rota publica

| Campo | Valor |
| --- | --- |
| Feature | [RF15](feature.md) |
| Branch | `feat/rf15-token-e-rota-publica` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF07-I01 |

## Contexto

Compartilhar exige uma rota que autorize por token em vez de por sessao - a unica
excecao a regra de autorizacao de RNF06. Por ser excecao, precisa estar isolada,
explicita e com escopo minimo.

O erro classico e usar o proprio id do projeto na URL publica. O id ja circula
nas rotas privadas e, mesmo sendo UUID, o modelo mental "id na URL = publico"
leva a exposicao acidental. Um token separado permite revogar sem mexer no
projeto e mantem os dois espacos de nomes distintos.

## Objetivo

Criar, revogar e consumir um token de compartilhamento, com uma rota publica que
devolve apenas o necessario para visualizar e executar.

## Escopo tecnico

- `apps/api/prisma/schema.prisma` - campos de compartilhamento
- `packages/shared/src/schemas/project.ts` - schema de projeto compartilhado
- `apps/api/src/modules/projects/routes.ts` - criar e revogar
- `apps/api/src/modules/share/routes.ts` (novo) - rota publica isolada
- `apps/api/src/app.ts` - registro e rate limit

## Passo a passo

1. Adicionar ao modelo `Project`: `shareToken` (unico, nullable, indexado) e
   `sharedAt`. Manter o token no proprio projeto e suficiente - uma tabela
   separada so faria sentido com varios links por projeto, o que esta fora do
   escopo.
2. Gerar o token com `randomBytes(16)` de `node:crypto` codificado em base64url:
   aleatoriedade suficiente para ser inadivinhavel e curto o bastante para
   caber numa mensagem.
3. Rotas do dono, sujeitas a autorizacao de RNF06:
   - `POST /api/projects/:id/share` - gera (ou devolve) o token;
   - `DELETE /api/projects/:id/share` - revoga, apagando o token.
4. Rota publica isolada em modulo proprio: `GET /api/share/:token`, devolvendo um
   `SharedProjectSchema` reduzido - `name`, `description`, `sources`,
   `updatedAt`. Sem `id` interno, sem `ownerId`, sem dado do dono.
5. Devolver `404` (nunca `403`) para token inexistente ou revogado: distinguir os
   dois casos entrega informacao a quem esta sondando.
6. Aplicar rate limit proprio na rota publica - e o unico endpoint alcancavel sem
   nenhuma barreira.
7. Definir o comportamento da simulacao a partir de um link: o visitante executa
   pelo mesmo `POST /api/simulations`, que ja e publico e ja tem rate limit
   (RF03-I02). Registrar essa decisao explicitamente.
8. Testar: gerar, ler pelo token, revogar, ler de novo (404), gerar duas vezes
   (mesmo token ou token novo - decidir e testar), e conferir que o retorno nao
   vaza campo nenhum do dono.

## Criterios de aceite

- [ ] Gerar produz um token unico, aleatorio e nao derivavel do id.
- [ ] `GET /api/share/:token` devolve o projeto sem dado do dono.
- [ ] Revogar invalida o acesso imediatamente.
- [ ] Token invalido e token revogado devolvem `404` identico.
- [ ] A rota publica tem rate limit proprio.
- [ ] A rota publica esta em modulo separado das rotas de projeto.
- [ ] `SharedProjectSchema` nao contem `ownerId` nem `id` interno.
- [ ] Ha teste cobrindo gerar, ler, revogar e ler de novo.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api exec prisma migrate dev
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- Reaproveitar `ProjectSchema` na resposta publica vaza campos por descuido; o
  schema reduzido e a protecao, e precisa ser o unico usado na rota.
- Sem RNF06, as rotas de gerar e revogar ficam abertas a qualquer um - o que
  permitiria compartilhar projeto alheio. Enquanto RNF06 nao entrar, isso precisa
  estar registrado no `README.md` como pendencia de seguranca.

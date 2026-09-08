# RNF06-I02 - Testes de acesso negado e revisao da superficie

| Campo | Valor |
| --- | --- |
| Feature | [RNF06](feature.md) |
| Branch | `chore/rnf06-testes-de-acesso-negado` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF06-I01 |

## Contexto

Autorizacao e o tipo de codigo que falha em silencio: quando funciona, nada
acontece; quando quebra, tambem nada acontece de visivel - ate alguem descobrir.
Testes de caminho feliz nao detectam a regressao, porque o caminho feliz continua
passando com a verificacao removida.

O teste que importa e o negativo: usuario A **nao** consegue o projeto de B.

A suite atual (`apps/api/src/modules/simulation/diagnostics.test.ts`) cobre
apenas o parser de diagnosticos - nao ha teste de rota no projeto.

## Objetivo

Cobrir com teste automatizado cada negativa de acesso e revisar toda a superficie
publica da API em busca de exposicao esquecida.

## Escopo tecnico

- `apps/api/src/modules/projects/routes.test.ts` (novo)
- `apps/api/src/modules/share/routes.test.ts` (novo)
- `apps/api/src/test/helpers.ts` (novo) - construcao do app e sessao falsa
- `docs/SEGURANCA.md` - matriz revisada

## Passo a passo

1. Montar os utilitarios de teste: construir a instancia do Fastify com
   `buildApp`, usar `app.inject` (dispensa porta e rede) e um modo de simular
   sessao de um usuario especifico sem passar pelo OAuth real.
2. Escrever a bateria negativa, uma por rota de projeto:
   - sem sessao -> `401`;
   - com sessao de A sobre projeto de B -> `404`;
   - com sessao de A sobre projeto inexistente -> `404` identico ao anterior
     (comparar corpo e cabecalhos, nao so o codigo);
   - `PATCH` de A em projeto de B nao altera nada - conferir o estado apos a
     tentativa, nao so a resposta;
   - `DELETE` de A em projeto de B nao apaga.
3. Escrever a bateria positiva minima, para garantir que a autorizacao nao
   quebrou o uso legitimo.
4. Testar as excecoes deliberadas: `GET /api/share/:token` funciona sem sessao;
   token revogado responde `404`; `POST /api/simulations` funciona anonimo.
5. Revisar toda a superficie publica: listar as rotas registradas
   (`app.printRoutes()`) e conferir cada uma contra a matriz de autorizacao.
   Rota que nao esta na matriz e ou esquecimento ou excecao nao documentada.
6. Conferir o que vaza no corpo das respostas: `ProjectSchema` nao deve levar
   `ownerId` ao cliente, e `SharedProjectSchema` nao deve levar dado do dono
   (RF15-I01).
7. Verificar as mensagens de erro: nenhuma pode revelar existencia de recurso
   alheio ou detalhe interno. O `setErrorHandler` de `app.ts` ja generaliza
   `5xx`; conferir os `4xx`.
8. Atualizar a matriz em `docs/SEGURANCA.md` com o resultado da revisao.

## Criterios de aceite

- [ ] Existe teste negativo para cada rota de projeto.
- [ ] Projeto alheio e projeto inexistente produzem resposta identica.
- [ ] `PATCH` e `DELETE` negados nao alteram o estado.
- [ ] As excecoes deliberadas tem teste proprio.
- [ ] Todas as rotas registradas constam da matriz de autorizacao.
- [ ] Nenhuma resposta expoe `ownerId` ou dado do dono.
- [ ] Nenhuma mensagem de erro revela existencia de recurso alheio.
- [ ] A suite roda sem Docker e sem rede.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- Testar so o codigo de status e insuficiente: um `PATCH` pode responder `404` e
  ainda assim ter escrito. Verificar o estado apos a tentativa.
- Sessao falsa nos testes que nao corresponda ao mecanismo real da uma falsa
  sensacao de cobertura; o utilitario precisa usar o mesmo caminho de leitura de
  sessao que a producao.
- A revisao de superficie precisa ser repetida a cada rota nova; anotar isso em
  `CLAUDE.md` junto da matriz.

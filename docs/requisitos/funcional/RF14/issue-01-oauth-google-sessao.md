# RF14-I01 - Fluxo OAuth2 com Google e sessao

| Campo | Valor |
| --- | --- |
| Feature | [RF14](feature.md) |
| Branch | `feat/rf14-oauth-google-sessao` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF07-I01 |

## Contexto

A API e completamente sem estado hoje: `app.ts` registra `helmet`, `cors` e
`rate-limit`, e nada mais. Introduzir login significa introduzir sessao, cookie e
segredo - tres coisas que precisam ser feitas certo da primeira vez, porque
corrigir autenticacao depois de publicada e caro.

O frontend chama a API por caminho relativo em desenvolvimento (proxy do Vite) e
por origem separada em producao (RF01-I01). Isso importa: cookie entre origens
diferentes exige `SameSite=None; Secure` e `credentials: 'include'`, o que muda a
configuracao do CORS.

## Objetivo

Implementar o fluxo OAuth2 com Google e uma sessao segura, sem expor segredo e
sem quebrar o acesso anonimo.

## Escopo tecnico

- `apps/api/package.json` - `@fastify/oauth2`, `@fastify/cookie`, `@fastify/session`
- `apps/api/src/config/env.ts` - variaveis de OAuth e segredo de sessao
- `apps/api/src/modules/auth/routes.ts` (novo)
- `apps/api/src/modules/auth/session.ts` (novo)
- `apps/api/src/app.ts` - registro dos plugins e ajuste de CORS
- `apps/api/.env.example` e `infra/docker-compose.yml`

## Passo a passo

1. Registrar a aplicacao no Google Cloud Console, obtendo client id e secret, com
   as URIs de redirecionamento de desenvolvimento e producao. Documentar o
   procedimento no `README.md` - e um passo de configuracao externo que o
   proximo mantenedor precisa repetir.
2. Adicionar ao `env.ts`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `SESSION_SECRET`, `AUTH_CALLBACK_URL` e `WEB_ORIGIN`. Seguir o padrao do
   arquivo: falhar no boot quando faltar variavel obrigatoria em producao. Nada
   de segredo com valor default.
3. Implementar as rotas:
   - `GET /api/auth/google` - inicia o fluxo com `state` para proteger contra
     CSRF;
   - `GET /api/auth/google/callback` - troca o codigo por token, busca o perfil,
     cria ou atualiza o usuario (RF14-I02) e estabelece a sessao;
   - `GET /api/auth/me` - devolve o usuario atual ou `null`;
   - `POST /api/auth/logout` - destroi a sessao no servidor.
4. Escolher o armazenamento de sessao. Recomendacao: sessao em cookie assinado,
   com o Redis ja existente como store quando for preciso invalidar do lado do
   servidor - `logout` de verdade exige isso.
5. Configurar o cookie: `httpOnly`, `Secure` em producao, `SameSite=Lax` quando
   frontend e API compartilham o site, `None` quando nao compartilham. Definir
   validade e renovacao.
6. Ajustar o CORS de `app.ts` para `credentials: true` e origem explicita - nao
   pode ser `*` com credenciais.
7. Criar um decorator/hook que popule `request.user` a partir da sessao, sem
   exigir autenticacao: as rotas continuam abertas nesta issue. A obrigatoriedade
   vem em RNF06.
8. Nunca devolver token do Google ao cliente. Guardar do perfil apenas o
   necessario: id do provedor, e-mail, nome e URL do avatar.
9. Aplicar rate limit especifico nas rotas de autenticacao.
10. Testar o fluxo em desenvolvimento (proxy do Vite) e simular o cenario de
    origens distintas de producao.

## Criterios de aceite

- [ ] O fluxo completo funciona e cria uma sessao.
- [ ] `GET /api/auth/me` devolve o usuario logado e `null` para anonimo.
- [ ] `POST /api/auth/logout` invalida a sessao no servidor, nao so no cliente.
- [ ] O cookie e `httpOnly` e `Secure` em producao.
- [ ] O parametro `state` e verificado no retorno.
- [ ] Nenhum segredo aparece no repositorio ou no bundle do frontend.
- [ ] Sem as variaveis obrigatorias, a API falha no boot em producao.
- [ ] As rotas existentes continuam funcionando para usuario anonimo.
- [ ] Token do Google nunca chega ao cliente.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
curl -i http://localhost:3333/api/auth/me
```

Manual: percorrer o fluxo completo no navegador, inspecionar os atributos do
cookie e conferir que sair invalida a sessao.

## Riscos

- Cookie entre origens diferentes e a fonte mais comum de falha em producao;
  validar cedo, com o deploy de RF01-I02, e nao so no fim.
- Vazar `GOOGLE_CLIENT_SECRET` compromete a aplicacao inteira: nunca em
  `.env.example`, nunca em log, nunca em mensagem de erro.
- Sessao apenas em cookie assinado nao permite revogar do servidor; se o `logout`
  precisar ser garantido, o store em Redis deixa de ser opcional.

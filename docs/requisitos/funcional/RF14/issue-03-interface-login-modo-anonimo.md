# RF14-I03 - Interface de login e convivencia com o modo anonimo

| Campo | Valor |
| --- | --- |
| Feature | [RF14](feature.md) |
| Branch | `feat/rf14-interface-login-modo-anonimo` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF14-I02, RF07-I02 |

## Contexto

Com backend e modelo prontos, falta a interface. O enunciado de RF14 diz
"de forma **opcional**", e essa palavra e a restricao de projeto mais importante
da issue: o login nao pode virar porteiro. Alguem que abre a URL publica precisa
escrever Verilog e simular sem parar em nenhuma tela de conta.

Ha um momento sensivel: o usuario trabalhou anonimo, tem codigo na tela e decide
entrar. O que acontece com esse trabalho precisa ser decidido pelo usuario, nunca
descartado.

## Objetivo

Expor o estado de autenticacao na interface e cuidar da transicao entre anonimo e
autenticado sem perda de trabalho.

## Escopo tecnico

- `apps/web/src/features/auth/use-session.ts` (novo)
- `apps/web/src/features/auth/user-menu.tsx` (novo)
- `apps/web/src/lib/api.ts` - `credentials` nas requisicoes
- `apps/web/src/features/workspace/workspace-header.tsx`
- `apps/web/src/features/projects/` - lista conforme o estado

## Passo a passo

1. Criar `useSession` consultando `GET /api/auth/me` uma vez na inicializacao,
   com tres estados: carregando, anonimo, autenticado. Nunca bloquear a
   renderizacao do workspace esperando essa resposta.
2. Incluir `credentials: 'include'` no `request` de `lib/api.ts`, necessario para
   o cookie de sessao viajar quando frontend e API estao em origens distintas.
3. No cabecalho: anonimo mostra "Entrar com Google"; autenticado mostra avatar,
   nome e menu com "Meus projetos" e "Sair".
4. Iniciar o login redirecionando para `/api/auth/google`, guardando antes o
   trabalho atual no rascunho local (RF07-I03) - o redirecionamento descarta o
   estado da pagina.
5. Ao voltar autenticado com rascunho local pendente, perguntar o que fazer:
   salvar como projeto novo, descartar, ou manter local e decidir depois.
6. Tratar sessao expirada durante o uso: uma resposta `401` em qualquer chamada
   volta a interface para anonimo com aviso, sem limpar o editor.
7. No modo anonimo, deixar explicito na lista de projetos que o trabalho e local
   e temporario, com o convite a entrar - informacao, nao obstaculo.
8. Sair encerra a sessao no servidor, limpa o estado local de usuario e mantem o
   codigo na tela.
9. Acessibilidade: menu operavel por teclado, avatar com texto alternativo,
   estado de autenticacao anunciavel.

## Criterios de aceite

- [ ] Abrir a aplicacao sem conta permite escrever e simular sem nenhuma barreira.
- [ ] O cabecalho mostra corretamente anonimo e autenticado.
- [ ] Entrar com trabalho na tela nao perde o codigo.
- [ ] O usuario escolhe o destino do rascunho ao entrar.
- [ ] Sessao expirada volta a anonimo com aviso, sem limpar o editor.
- [ ] Sair encerra a sessao e mantem o codigo na tela.
- [ ] No modo anonimo fica claro que o trabalho e local e temporario.
- [ ] O menu de usuario e operavel por teclado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: trabalhar anonimo, entrar, escolher cada uma das opcoes de rascunho; sair
e conferir que o codigo permanece; expirar a sessao manualmente e observar o
comportamento.

## Riscos

- Consultar `me` de forma bloqueante atrasa a primeira pintura e contraria RF01;
  a consulta e assincrona e a interface parte de "anonimo".
- Um dialogo de rascunho que aparece em toda entrada vira ruido; so aparecer
  quando houver conteudo diferente do exemplo padrao.

# RNF06-I01 - Autorizacao nas rotas de projeto

| Campo | Valor |
| --- | --- |
| Feature | [RNF06](feature.md) |
| Branch | `feat/rnf06-autorizacao-rotas-projeto` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF14-I02 |

## Contexto

As cinco rotas de `apps/api/src/modules/projects/routes.ts` operam diretamente
sobre `repository`, sem nocao de quem esta chamando. RF14-I01 introduz
`request.user`; RF14-I02 introduz `ownerId` e o escopo obrigatorio na interface
do repositorio.

Esta issue e onde as duas pecas se encontram. O ponto de projeto importante: onde
a verificacao mora. Colocar um `if (project.ownerId !== request.user.id)` em cada
handler funciona e falha na primeira rota nova que alguem escrever sem lembrar. A
alternativa estrutural e o escopo obrigatorio no repositorio - o compilador cobra
o argumento, e uma rota nova nao compila sem ele.

## Objetivo

Exigir sessao e verificar posse em toda operacao sobre projeto, de forma que
esquecer a verificacao seja dificil, nao apenas desaconselhado.

## Escopo tecnico

- `apps/api/src/modules/auth/require-session.ts` (novo) - hook
- `apps/api/src/modules/projects/routes.ts` - hook e escopo
- `apps/api/src/modules/projects/prisma-repository.ts` - filtro por dono
- `apps/api/src/modules/projects/repository.ts` - interface
- `apps/api/src/modules/share/routes.ts` - excecao explicita

## Passo a passo

1. Criar um hook `preHandler` que exija sessao e responda `401` no formato
   `ApiErrorSchema` quando nao houver. Aplica-lo ao plugin de rotas de projeto
   inteiro, e nao rota a rota.
2. Garantir que o escopo de dono seja parametro obrigatorio de todos os metodos
   do repositorio (preparado em RF14-I02) e que o filtro aconteca **dentro** da
   implementacao - a consulta ao Postgres ja sai filtrada por `ownerId`.
3. Responder `404`, e nao `403`, para projeto de outro usuario. `403` confirma que
   o projeto existe; `404` nao revela nada. Usar exatamente a mesma resposta de
   projeto inexistente.
4. Aplicar a mesma regra a exportacao (RF08-I01) e as rotas de compartilhamento
   (RF15-I01) - sao operacoes sobre projeto.
5. Manter explicitamente fora do escopo:
   - `GET /api/share/:token` - a excecao deliberada, em modulo proprio;
   - `POST /api/simulations` e `GET /api/simulations/:jobId` - publicas, porque
     recebem codigo no corpo e nao leem projeto;
   - `/health`.
   Comentar cada excecao no codigo, dizendo por que.
6. Rever o `GET /api/simulations/:jobId`: o `jobId` vem do BullMQ e e sequencial.
   Sem verificacao, alguem pode iterar ids e ler o resultado - incluindo o codigo
   de outra pessoa, se o resultado carregar isso. Avaliar e, se necessario,
   restringir o acesso ao resultado a quem submeteu.
7. Atualizar o frontend para tratar `401` de forma consistente (RF14-I03).
8. Documentar a matriz de autorizacao no `README.md` ou em `docs/SEGURANCA.md`:
   uma linha por rota, dizendo se exige sessao e por que.

## Criterios de aceite

- [ ] Todas as rotas de projeto respondem `401` sem sessao.
- [ ] Listar traz apenas os projetos do usuario autenticado.
- [ ] Acessar projeto de outro usuario responde `404`, identico a inexistente.
- [ ] O filtro por dono acontece na consulta, nao apos buscar tudo.
- [ ] Exportar e compartilhar seguem a mesma regra.
- [ ] A rota publica de RF15 continua funcionando sem sessao.
- [ ] `POST /api/simulations` continua publica.
- [ ] O acesso ao resultado de simulacao foi avaliado e a decisao registrada.
- [ ] Cada excecao esta comentada no codigo.
- [ ] Ha matriz de autorizacao documentada.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
curl -i http://localhost:3333/api/projects   # deve responder 401
```

## Riscos

- Filtrar em memoria apos buscar todos os projetos "funciona" e vaza pelo tempo
  de resposta e pela contagem; o filtro precisa estar na consulta.
- `403` em vez de `404` transforma a API em oraculo de existencia de projetos.
- O `jobId` sequencial do BullMQ e uma superficie facil de esquecer; avaliar
  agora, e nao depois de publicar.

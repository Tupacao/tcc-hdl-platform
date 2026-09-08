# RF01-I01 - Build de producao do frontend e configuracao por ambiente

| Campo | Valor |
| --- | --- |
| Feature | [RF01](feature.md) |
| Branch | `feat/rf01-build-producao-frontend` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

Hoje o frontend so roda em desenvolvimento, apoiado no proxy do Vite (`/api` para
`localhost:3333`). Em producao esse proxy nao existe: o bundle estatico e servido
por outro host e precisa saber para onde enviar as requisicoes.

## Objetivo

Produzir um bundle de producao publicavel e parametrizar a origem da API por
variavel de ambiente, sem quebrar o fluxo de desenvolvimento atual.

## Escopo tecnico

- `apps/web/src/lib/api.ts` - base URL configuravel.
- `apps/web/.env.example` - documentar `VITE_API_BASE_URL`.
- `apps/web/vite.config.ts` - manter o proxy apenas em `dev`.
- `README.md` - secao de build de producao.

## Passo a passo

1. Ler `VITE_API_BASE_URL` (default vazio, que preserva o caminho relativo `/api`
   usado hoje em dev) e prefixar todas as chamadas de `lib/api.ts`.
2. Garantir que nenhum outro ponto do codigo monte URL de API manualmente.
3. Rodar `pnpm --filter @tplab/web build` e conferir o conteudo de `dist/`.
4. Servir o `dist/` com um servidor estatico apontando `VITE_API_BASE_URL` para a
   API local e validar o fluxo completo.
5. Conferir que o chunk do `monaco-editor` continua separado do bundle principal.

## Criterios de aceite

- [ ] `pnpm --filter @tplab/web build` conclui sem erro.
- [ ] Com `VITE_API_BASE_URL` vazio, o comportamento de `pnpm dev` e identico ao
      atual.
- [ ] Com `VITE_API_BASE_URL` apontando para outra origem, o build servido
      estaticamente completa uma simulacao.
- [ ] `.env.example` documenta a variavel.

## Verificacao

```bash
pnpm --filter @tplab/web build
pnpm --filter @tplab/web preview
pnpm typecheck
```

## Riscos

- Chamar a API em outra origem exige CORS liberado, tratado na issue 02. Ate la,
  testar servindo o `dist/` atras do mesmo proxy.

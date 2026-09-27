# RF03-I01 - Limites e validacao de submissao

| Campo | Valor |
| --- | --- |
| Feature | [RF03](feature.md) |
| Branch | `feat-RF03-01-limites-de-submissao-back` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

`HdlFileSchema` ja limita cada arquivo a `MAX_SOURCE_BYTES` (256 KB) e restringe
o nome por regex. Faltam duas coisas: o limite do corpo da requisicao no proprio
Fastify (a validacao Zod so roda depois do parse) e mensagens de erro que o
usuario entenda.

## Objetivo

Rejeitar cedo e com clareza qualquer submissao fora dos limites, antes de gastar
recurso de fila ou container.

## Escopo tecnico

- `apps/api/src/app.ts` - `bodyLimit` do Fastify.
- `apps/api/src/modules/simulation/routes.ts` - tratamento de erro de validacao.
- `packages/shared/src/schemas/hdl.ts` - mensagens dos schemas.
- `apps/web/src/lib/api.ts` - exibir a mensagem retornada.

## Passo a passo

1. Definir `bodyLimit` no Fastify com folga sobre `MAX_SOURCE_BYTES` vezes o
   numero de arquivos, e devolver `413` com corpo no formato `ApiErrorSchema`.
2. Adicionar mensagens em portugues aos schemas Zod de `hdl.ts` (nome de arquivo,
   tamanho, `topModule`).
3. Garantir que o error handler traduza `ZodError` para `ApiErrorSchema` com
   `400`, sem vazar stack.
4. Exibir a mensagem no frontend como toast, no lugar de "Falha ao executar a
   simulacao".
5. Escrever teste com `node:test` cobrindo: arquivo acima do limite, extensao
   invalida, `topModule` vazio.

## Criterios de aceite

- [x] Corpo acima do `bodyLimit` retorna `413` com JSON valido.
- [x] Arquivo com extensao diferente de `.v`/`.sv` retorna `400` com mensagem em
      portugues.
- [x] Conteudo acima de 256 KB retorna `400`, sem criar job.
- [x] Nenhum job entra na fila quando a validacao falha.
- [x] Mensagem chega ao usuario no toast do frontend. _(ja coberta pela barra de
      estado do RF09-I03, que exibe `runMutation.error.message` — o mesmo texto
      que a API devolve; nenhuma mudanca de frontend fez parte desta issue)_

## Nota de implementacao

O passo a passo original previa alterar `apps/web/src/lib/api.ts` para exibir a
mensagem via toast. Isso ficou obsoleto: RF09-I03 (concluida antes desta issue)
ja mostra `runMutation.error?.message` na barra de estado do workspace — a
mesma mensagem que `request()` extrai do corpo de erro da API. Como
front e back nunca compartilham branch (`docs/ARCHITECTURE.md`), e o front ja
cobria o criterio, esta issue ficou 100% backend: `apps/api/src/app.ts`
(bodyLimit dimensionado a partir de `MAX_SOURCE_BYTES`, tratamento de `413` e
mensagem especifica do Zod no `400`) e `packages/shared/src/schemas/{hdl,common}.ts`
(mensagens em portugues de tamanho de arquivo e `topModule` vazio). Testes em
`apps/api/src/modules/simulation/routes.test.ts`.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- `bodyLimit` muito apertado quebra projetos legitimos com testbench grande;
  dimensionar com base no maior exemplo de `apps/web/src/lib/samples.ts`.

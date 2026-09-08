# RF03-I01 - Limites e validacao de submissao

| Campo | Valor |
| --- | --- |
| Feature | [RF03](feature.md) |
| Branch | `feat/rf03-limites-de-submissao` |
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

- [ ] Corpo acima do `bodyLimit` retorna `413` com JSON valido.
- [ ] Arquivo com extensao diferente de `.v`/`.sv` retorna `400` com mensagem em
      portugues.
- [ ] Conteudo acima de 256 KB retorna `400`, sem criar job.
- [ ] Nenhum job entra na fila quando a validacao falha.
- [ ] Mensagem chega ao usuario no toast do frontend.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- `bodyLimit` muito apertado quebra projetos legitimos com testbench grande;
  dimensionar com base no maior exemplo de `apps/web/src/lib/samples.ts`.

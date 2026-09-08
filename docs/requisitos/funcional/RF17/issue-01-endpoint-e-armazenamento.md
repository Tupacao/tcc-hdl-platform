# RF17-I01 - Endpoint, validacao e armazenamento do feedback

| Campo | Valor |
| --- | --- |
| Feature | [RF17](feature.md) |
| Branch | `feat/rf17-endpoint-e-armazenamento` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF07-I01 |

## Contexto

Um endpoint publico que aceita texto livre e grava no banco e o tipo de rota que
precisa de cuidado desde o primeiro commit: e alvo facil de automacao, e o texto
recebido nunca deve ser tratado como confiavel.

A API ja tem `@fastify/rate-limit` global com `max: 60` por minuto - generoso
demais para envio de feedback, e configuravel por rota.

## Objetivo

Receber, validar e armazenar feedback, com limites e sem confiar em nada do que
chega.

## Escopo tecnico

- `packages/shared/src/schemas/feedback.ts` (novo)
- `apps/api/prisma/schema.prisma` - modelo `Feedback`
- `apps/api/src/modules/feedback/routes.ts` (novo)
- `apps/api/src/app.ts` - registro do modulo

## Passo a passo

1. Definir `FeedbackSchema` em `packages/shared`:
   - `kind`: `z.enum(['problema', 'sugestao', 'elogio', 'outro'])`;
   - `message`: `z.string().min(10).max(2000)` - minimo evita envio vazio,
     maximo evita abuso;
   - `contact`: `z.string().email().max(200).nullish()`;
   - `context`: objeto opcional com `userAgent`, `viewport`, `lastFailure`,
     `projectId`, todos opcionais.
   Escrever mensagens de erro em portugues, como previsto em RF03-I01.
2. Rodar `pnpm --filter @tplab/shared build`.
3. Modelar `Feedback` no Prisma: `id`, `kind`, `message`, `contact`, `context`
   (`Json`), `createdAt`, `userId` (nullable, para RF14) e `ipHash`.
4. Guardar o IP como **hash com sal**, nunca em claro: serve para agrupar abuso
   sem virar registro de identificacao pessoal.
5. Implementar `POST /api/feedback` com rate limit proprio e restritivo
   (sugestao: 3 envios por hora por origem), respondendo `201` sem corpo ou com
   confirmacao minima.
6. Tratar o texto como dado, sempre: nada de interpolar em log estruturado sem
   escape, nada de renderizar como HTML em qualquer visualizacao futura.
7. Limitar o tamanho do `context` e ignorar campos desconhecidos - o schema Zod
   ja faz isso, mas o limite de corpo precisa ser conferido.
8. Prover a leitura dos envios. Recomendacao para o MVP: consulta SQL direta
   documentada no `README.md`, sem construir painel. Se uma rota de leitura for
   criada, ela precisa exigir autorizacao - dado de feedback nao pode ser
   publico.
9. Testar: envio valido, mensagem curta demais, mensagem longa demais, contato
   invalido, contexto ausente, e o limite de envios.

## Criterios de aceite

- [ ] `POST /api/feedback` aceita envio valido e persiste.
- [ ] Mensagem fora dos limites retorna `400` com mensagem em portugues.
- [ ] O quarto envio na mesma hora retorna `429`.
- [ ] O IP e armazenado apenas como hash.
- [ ] O feedback e armazenado sem sessao, e associado ao usuario quando houver.
- [ ] Nenhuma rota publica le feedback.
- [ ] O procedimento de leitura esta documentado.
- [ ] Ha teste para cada caso de validacao e para o limite.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api exec prisma migrate dev
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- Guardar IP em claro cria dado pessoal sem necessidade; o hash com sal resolve o
  proposito real, que e detectar abuso.
- Um endpoint publico de escrita sem limite enche a tabela em minutos; o rate
  limit e requisito de entrega, nao melhoria posterior.
- Texto livre colado por usuarios pode conter dado sensivel; nao replicar esse
  conteudo em logs.

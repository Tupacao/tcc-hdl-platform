# RF19-I01 - Catalogo de eventos e coleta anonima

| Campo | Valor |
| --- | --- |
| Feature | [RF19](feature.md) |
| Branch | `feat/rf19-eventos-e-coleta` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF07-I01 |

## Contexto

Nao existe coleta nenhuma hoje - o que e a melhor posicao possivel para comecar,
porque nada precisa ser desfeito. A decisao inicial define o resto: coletar
eventos genericos com carga livre convida a coletar demais; um catalogo fechado
mantem o escopo sob controle e torna a promessa de anonimato verificavel.

Boa parte do dado ja nasce no pipeline: `SimulationResultSchema` carrega
`durationMs` e `failure`, e RF03-I04 instrumenta o worker.

## Objetivo

Definir um catalogo fechado de eventos e registra-los, sem qualquer dado que
permita identificar uma pessoa.

## Escopo tecnico

- `packages/shared/src/schemas/analytics.ts` (novo) - catalogo
- `apps/api/prisma/schema.prisma` - modelo `UsageEvent`
- `apps/api/src/modules/analytics/` (novo) - registro e rota
- `apps/api/src/worker.ts` - eventos de simulacao
- `apps/web/src/lib/analytics.ts` (novo) - eventos de cliente

## Passo a passo

1. Definir o catalogo como uniao discriminada em Zod, cada evento com campos
   fixos:
   - `simulation_finished`: `failure`, `durationMs`, `sourceBytes`,
     `diagnosticCount`, `hasVcd`;
   - `project_created`, `project_exported`, `project_shared`;
   - `theme_changed`: `theme`;
   - `waveform_opened`, `tour_completed`, `tour_skipped`, `docs_opened`.
   Nenhum campo de texto livre - texto livre e por onde dado pessoal vaza.
2. Modelar `UsageEvent` no Prisma: `id`, `kind`, `payload` (`Json`),
   `createdAt`, `sessionHash` (nullable). Sem `userId`, sem IP, sem user agent
   completo.
3. Sobre o `sessionHash`: para responder "quantas simulacoes por sessao" e
   preciso agrupar eventos de uma mesma visita. Usar um identificador efemero de
   sessao, guardado em `sessionStorage`, que morre ao fechar a aba e nao
   atravessa visitas. Documentar que ele existe e por que nao identifica pessoa.
4. Emitir os eventos de simulacao **no servidor**, no worker, aproveitando a
   instrumentacao de RF03-I04 - mais confiavel que depender do cliente.
5. Emitir os eventos de interface no cliente por `POST /api/analytics`, em lote e
   com `navigator.sendBeacon` quando disponivel, para nao competir com as
   requisicoes que importam.
6. Falhar em silencio: erro na coleta nunca pode aparecer para o usuario nem
   interromper o fluxo. Nada de retentativa agressiva.
7. Aplicar rate limit na rota, como em qualquer endpoint publico de escrita.
8. Definir e implementar retencao: eventos antigos sao apagados apos um prazo
   documentado (sugestao: 180 dias, cobrindo o periodo do TCC com folga).
9. Testar que nenhum evento carrega codigo, e-mail, IP ou identificador estavel.

## Criterios de aceite

- [ ] O catalogo e fechado e validado por Zod, sem campo de texto livre.
- [ ] Cada simulacao gera um evento com desfecho e duracao.
- [ ] Nenhum evento contem codigo, e-mail, IP ou identificador estavel.
- [ ] O identificador de sessao e efemero e documentado.
- [ ] Falha na coleta nao afeta o usuario.
- [ ] A rota tem rate limit.
- [ ] Ha politica de retencao implementada e documentada.
- [ ] Ha teste garantindo a ausencia de campos sensiveis.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api exec prisma migrate dev
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- Evento generico com carga livre e o caminho mais curto para coletar dado
  pessoal sem perceber; o catalogo fechado e a protecao estrutural.
- Coletar antes de RF19-I02 (aviso e recusa) significa coletar sem consentimento;
  as duas issues precisam entrar juntas, ou a coleta comeca desligada.

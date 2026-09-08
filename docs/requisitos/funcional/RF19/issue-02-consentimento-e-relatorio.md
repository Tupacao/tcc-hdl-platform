# RF19-I02 - Aviso, recusa e relatorio agregado

| Campo | Valor |
| --- | --- |
| Feature | [RF19](feature.md) |
| Branch | `feat/rf19-consentimento-e-relatorio` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF19-I01 |

## Contexto

Coletar sem avisar e indefensavel num trabalho academico com usuarios reais. E do
outro lado, coletar sem conseguir consultar e trabalho perdido: os dados de
RF19-I01 so viram evidencia no TCC se houver como agrega-los.

Esta issue fecha as duas pontas: a etica da coleta e o uso do que foi coletado.

## Objetivo

Informar o usuario sobre a coleta, permitir recusar, e produzir o relatorio
agregado que sustenta o capitulo de resultados.

## Escopo tecnico

- `apps/web/src/features/analytics/consent-banner.tsx` (novo)
- `apps/web/src/lib/analytics.ts` - respeitar a recusa
- `apps/web/src/features/docs/content/privacidade.tsx` (novo)
- `apps/api/src/modules/analytics/report.ts` (novo) - consultas agregadas

## Passo a passo

1. Escrever o texto do aviso: curto, honesto, com a lista concreta do que e
   coletado a um clique - reaproveitando o catalogo de RF19-I01 como fonte, para
   que o texto nao envelheca quando um evento novo entrar.
2. Adicionar uma pagina de privacidade dentro da documentacao (RF11): o que e
   coletado, por que, por quanto tempo, e como recusar.
3. Guardar a preferencia em `localStorage` (`tplab-analytics`), com `try/catch`,
   no padrao do `ThemeProvider`. Definir o comportamento padrao antes de o
   usuario escolher - recomendacao: nao coletar do cliente ate haver escolha, e
   manter apenas os eventos de servidor, que ja sao anonimos por construcao.
4. Respeitar a recusa em `lib/analytics.ts`, com verificacao no ponto de envio -
   nao apenas escondendo o banner.
5. Deixar o controle acessivel depois de o aviso sumir, junto das preferencias ou
   no menu de ajuda.
6. Implementar as consultas agregadas que respondem as perguntas de RF19:
   contagem de simulacoes, taxa por tipo de falha, distribuicao de duracao
   (mediana, p90, p95 - a mediana diz mais que a media aqui), funcionalidades
   usadas, eventos por sessao.
7. Expor o relatorio de forma protegida ou documentar as consultas SQL no
   `README.md`. Recomendacao para o MVP: consultas documentadas, sem rota - um
   endpoint de leitura seria mais uma superficie a proteger.
8. Gerar o relatorio uma vez sobre dados reais e conferir que as perguntas de
   fato sao respondidas - descobrir que falta um campo depois do periodo de
   coleta e irreversivel.

## Criterios de aceite

- [ ] O aviso aparece uma vez, e informa o que e coletado.
- [ ] A lista detalhada esta a um clique e corresponde ao catalogo real.
- [ ] Recusar impede o envio de eventos do cliente.
- [ ] A escolha e reversivel a qualquer momento.
- [ ] Ha pagina de privacidade na documentacao.
- [ ] As consultas agregadas respondem as perguntas de RF19.
- [ ] O relatorio nao e publico.
- [ ] O relatorio foi gerado ao menos uma vez sobre dados reais.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
pnpm --filter @tplab/api test
```

Manual: recusar e confirmar, pela aba de rede, que nada e enviado; reverter e
confirmar que voltou.

## Riscos

- Banner que bloqueia a tela contraria RF01 ("abra o link e comece"); precisa ser
  informativo e dispensavel, nao um porteiro.
- Descobrir no fim do periodo que falta um campo para responder uma pergunta e
  irreversivel; gerar o relatorio cedo, com poucos dados, e a protecao.

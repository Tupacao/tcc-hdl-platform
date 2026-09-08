# RNF07-I02 - Reducao das etapas fora do orcamento

| Campo | Valor |
| --- | --- |
| Feature | [RNF07](feature.md) |
| Branch | `feat/rnf07-reducao-de-latencia` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF07-I01 |

## Contexto

Com a medicao de RNF07-I01 em maos, esta issue ataca as etapas que mais pesam.
As candidatas conhecidas, antes de medir:

- **criacao do container** - `createContainer` mais `start` custam centenas de
  milissegundos por execucao, pagos toda vez;
- **polling a 400 ms** - acrescenta ate 400 ms de latencia percebida no fim; o
  comentario em `apps/web/src/lib/api.ts` ja registra SSE/WebSocket como
  alternativa;
- **espera na fila** - com `concurrency: 2` na VM B2s de 2 vCPU, o terceiro
  usuario simultaneo espera;
- **parse e primeiro desenho do VCD** - RF06-I04 trata do caso grande, mas o caso
  pequeno tambem entra na conta.

A regra desta issue: **so otimizar o que a medicao apontou**. Reduzir uma etapa
que responde por 3% do tempo total e trabalho perdido.

## Objetivo

Trazer o tempo ponta a ponta dos exemplos de referencia para dentro dos cinco
segundos, atacando as etapas identificadas como dominantes.

## Escopo tecnico

Depende do resultado da medicao. Candidatos:

- `apps/web/src/lib/api.ts` - estrategia de polling
- `apps/api/src/modules/simulation/sandbox.ts` - ciclo do container
- `apps/api/src/worker.ts` - concorrencia
- `apps/web/src/features/waveform/` - parse e desenho

## Passo a passo

1. Ordenar as etapas por custo, conforme RNF07-I01, e atacar de cima para baixo.
2. **Polling**, se for relevante: reduzir o intervalo inicial (por exemplo 150 ms
   nos primeiros segundos, subindo em seguida) e aumentar depois - simulacao
   tipica termina rapido, e o intervalo fixo de 400 ms desperdica a espera final.
   Custa pouco e nao muda a API. SSE elimina o atraso de vez, ao custo de uma
   rota nova e de tratamento de reconexao - avaliar contra o prazo.
3. **Criacao do container**: verificar se a imagem esta sempre presente no host
   (um `pull` implicito destroi o orcamento) e medir o ganho de opcoes mais
   baratas de criacao. Manter um pool de containers quentes contraria RNF04, que
   exige container efemero por execucao - nao e caminho aceitavel.
4. **Concorrencia**: avaliar se `concurrency: 2` e o valor certo para 2 vCPU com
   `SANDBOX_CPUS: 0.5`. Na aritmetica simples cabem mais jobs; medir antes de
   mudar, porque memoria e I/O tambem contam.
5. **Frontend**: se o parse ou o primeiro desenho aparecerem na conta, aplicar o
   que RF06-I04 preve (worker e reducao por pixel).
6. Melhorar a **latencia percebida** mesmo onde a real nao cair: estado visivel a
   cada etapa (RF04-I03) e o que faz cinco segundos parecerem aceitaveis.
7. Repetir a medicao de RNF07-I01 apos cada mudanca e registrar o antes e o
   depois - sem isso nao ha como saber se a otimizacao funcionou.
8. Se o alvo nao for atingido, registrar a causa e a conclusao honestamente em
   `docs/DESEMPENHO.md`. Um requisito nao cumprido com causa identificada e um
   resultado valido no TCC.

## Criterios de aceite

- [ ] As otimizacoes atacaram as etapas que a medicao apontou como dominantes.
- [ ] Ha registro de antes e depois para cada mudanca.
- [ ] Os exemplos de RF20 completam em menos de 5 s no p95, ou a causa esta
      registrada.
- [ ] Nenhuma otimizacao enfraqueceu o isolamento de RNF04.
- [ ] O usuario ve estado visivel durante toda a espera.
- [ ] Mudancas de concorrencia foram validadas na VM alvo.
- [ ] `docs/DESEMPENHO.md` esta atualizado com a conclusao.

## Verificacao

```bash
pnpm sandbox:build
pnpm --filter @tplab/api test
pnpm typecheck
```

Repetir o protocolo de medicao de RNF07-I01 e comparar.

## Riscos

- Reutilizar containers reduziria a latencia e quebraria RNF04; a linha e clara:
  desempenho nao compra isolamento.
- Aumentar `concurrency` sem medir memoria pode levar a VM ao OOM sob carga - e
  ai o custo aparece como falha, nao como lentidao.
- Polling agressivo demais multiplica requisicoes e sobrecarrega a API com muitos
  usuarios; o intervalo crescente equilibra os dois lados.

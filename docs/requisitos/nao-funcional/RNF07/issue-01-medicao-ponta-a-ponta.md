# RNF07-I01 - Medicao ponta a ponta e orcamento de latencia

| Campo | Valor |
| --- | --- |
| Feature | [RNF07](feature.md) |
| Branch | `chore/rnf07-medicao-ponta-a-ponta` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF03-I04 |

## Contexto

`durationMs` mede apenas o intervalo dentro de `runInSandbox` - do inicio da
escrita dos arquivos ate a leitura do `.vcd`. Fora dessa janela ficam a
requisicao, a espera na fila, o polling do cliente e a renderizacao. O usuario
percebe o total, nao a parte medida.

Sem repartir o tempo por etapa e impossivel saber onde otimizar: os cinco
segundos podem estar sendo gastos na criacao do container, na compilacao ou em
400 ms de polling somados a um parse lento.

## Objetivo

Medir o tempo ponta a ponta, repartido por etapa, com os exemplos de referencia,
na VM alvo.

## Escopo tecnico

- `apps/api/src/modules/simulation/sandbox.ts` - tempos parciais
- `apps/api/src/worker.ts` - tempo de espera na fila
- `apps/web/src/lib/api.ts` - marcas de tempo do cliente
- `apps/web/src/features/waveform/` - tempo de parse e desenho
- `docs/DESEMPENHO.md` (novo) - metodo e resultados

## Passo a passo

1. Definir por escrito o que sera medido: os exemplos de RF20 como "baixa
   complexidade", a VM B2s sem fila acumulada e com a imagem ja presente como
   "condicoes normais", e o intervalo do clique ate a forma de onda desenhada
   como "resposta".
2. Instrumentar as etapas do servidor, aproveitando RF03-I04: recebimento,
   enfileiramento, espera na fila (`processedOn - timestamp`), criacao do
   container, `start`, compilacao, simulacao, leitura de logs, leitura do `.vcd`.
3. Separar compilacao de simulacao. Hoje as duas acontecem dentro do mesmo
   `run-simulation.sh` e chegam como um numero unico; emitir a marca de tempo
   entre `iverilog` e `vvp` no proprio script, ou medir por etapas separadas.
4. Instrumentar o cliente com `performance.now()`: clique, resposta do `POST`,
   cada volta do polling, resposta final, fim do parse do VCD, fim do primeiro
   desenho.
5. Medir cada exemplo pelo menos 20 vezes, registrando mediana, p95 e maximo. A
   mediana descreve o caso comum; o p95 e o que decide se o requisito e cumprido.
6. Medir tres cenarios: fila vazia, fila com um job a frente, e dois jobs
   simultaneos (o limite do `concurrency: 2`).
7. Medir na VM alvo, alem da maquina de desenvolvimento, e registrar as duas.
8. Medir tambem o carregamento inicial da aplicacao (Monaco incluido), que nao e
   objeto do requisito mas conta para a primeira impressao.
9. Consolidar em `docs/DESEMPENHO.md`: metodo, ambiente, tabela por etapa e a
   conclusao sobre o cumprimento do alvo.

## Criterios de aceite

- [ ] "Baixa complexidade" e "condicoes normais" estao definidos por escrito.
- [ ] Cada etapa tem tempo medido, no servidor e no cliente.
- [ ] Compilacao e simulacao aparecem separadas.
- [ ] Ha mediana, p95 e maximo, com pelo menos 20 amostras por exemplo.
- [ ] Os tres cenarios de fila foram medidos.
- [ ] Ha medicao na VM alvo.
- [ ] A etapa de maior custo esta identificada.
- [ ] `docs/DESEMPENHO.md` traz metodo, ambiente e resultados.

## Verificacao

```bash
pnpm sandbox:build
pnpm dev:worker
curl -s http://localhost:3333/health/metrics
```

Manual: executar cada exemplo 20 vezes e coletar as marcas do cliente pelo painel
de performance do navegador.

## Riscos

- Medir com a imagem do sandbox ausente inclui o tempo de construcao e distorce
  tudo; garantir que a imagem esteja presente antes de medir.
- A primeira execucao apos subir o worker costuma ser mais lenta (conexao com
  Redis, cache do Docker); descartar a primeira amostra e registrar isso.
- Medir so em desenvolvimento produz numero otimista - a VM B2s tem menos CPU que
  a maquina de desenvolvimento.

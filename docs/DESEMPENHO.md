# Desempenho — medição ponta a ponta (RNF07)

Alvo (RNF07): simulações de baixa complexidade respondem em **menos de 5 s**, em condições
normais de operação. Este documento define os termos, descreve o método e registra os números
citáveis no TCC. Reprodução: `pnpm --filter @tplab/api measure:e2e` (servidor) e
`pnpm --filter @tplab/api measure:sandbox` (só o container).

## 1. Definições operacionais

| Termo do requisito | Definição adotada |
| --- | --- |
| Baixa complexidade | Os exemplos de referência (`apps/api/scripts/examples.ts`): somador, mux 4:1, contador de 4 bits, ULA e deslocamento de 8 bits. Um caso pesado deliberado (contador de 16 bits, 200 mil ciclos, `$dumpvars` completo) é medido à parte e **não** entra no alvo. |
| Condições normais | VM B2s prevista, **um** job por vez (sem fila acumulada), imagem `tplab-sandbox` já presente no host, worker já iniciado. |
| Resposta | Do clique em "Executar" até a forma de onda desenhada. O servidor cobre da entrada na fila até o resultado visível ao polling; o cliente (renderização) é medido na PR de front. |

## 2. Etapas medidas no servidor

O worker devolve `timings` no resultado (`SimulationTimingsSchema` em `packages/shared`):

| Campo | O que mede | Origem |
| --- | --- | --- |
| `queueWaitMs` | espera na fila (`processedOn - timestamp`) | BullMQ, `worker.ts` |
| `containerCreateMs` | `docker.createContainer` | `sandbox.ts` |
| `executionMs` | `start` até o fim do container (inclui subir o processo e a leitura do resultado) | `sandbox.ts` |
| `compileMs` / `simulateMs` | `iverilog` / `vvp`, em centésimos de segundo | `run-simulation.sh` (linha `@@tplab-timing`, removida do stderr antes de chegar ao usuário) |
| `artifactsReadMs` | leitura de logs e do `.vcd` | `sandbox.ts` |

`compileMs` e `simulateMs` são `null` quando a etapa não terminou (ex.: erro de compilação não tem
`simulateMs`). O relógio do script é `/proc/uptime` (o busybox não tem `date +%N`), com resolução
de 10 ms.

## 3. Método

- `measure-e2e.ts` enfileira direto no BullMQ (a rota HTTP tem limite de 10 `POST`/min, RF03-I02, e
  barraria a medição) e consulta o estado a cada **400 ms**, como `runSimulation` no navegador. O
  custo do HTTP local (poucos ms) fica de fora; o atraso do polling entra (`pollLagMs`).
- Três cenários: 1 job (fila vazia), 2 jobs simultâneos (o limite do `concurrency: 2`) e 3
  simultâneos (o terceiro espera na fila).
- 20 rodadas no cenário de 1 job (n=20) e 10 rodadas nos demais (n=20 e n=30 amostras). A **primeira
  rodada de cada cenário é descartada** (conexão com o Redis, cache do Docker). Estatística:
  mediana, p95 e máximo.
- A imagem do sandbox já estava construída antes de medir.

## 4. Ambiente

**Máquina de desenvolvimento**, 2026-09-29: Windows 11, Docker via Rancher Desktop (WSL2), worker
com `concurrency: 2`, limites de sandbox padrão (0,5 CPU e 128 MB por job). **A VM B2s ainda não
existe (RF01-I02): as medições nela estão pendentes.** Os números abaixo são otimistas em CPU
(a B2s tem 2 vCPU) e pessimistas em I/O de container (ver 6).

## 5. Resultados (ms)

### Exemplos de referência

Um job por vez — o cenário "condições normais":

| Caso | Total (mediana) | Total (p95) | Total (máx) |
| --- | --- | --- | --- |
| somador | 3270 | 3662 | 3664 |
| contador 4 bits | 3296 | 3703 | 3709 |

Repartição do somador (mediana / p95), um job:

| Etapa | Mediana | p95 |
| --- | --- | --- |
| Enfileirar | 1 | 1 |
| Espera na fila | 2 | 2 |
| Criar o container | 1498 | 1771 |
| Executar o container (start → saída) | 955 | 1117 |
| ↳ compilar (`iverilog`) | 10 | 20 |
| ↳ simular (`vvp`) | 10 | 20 |
| Ler logs e `.vcd` | 3 | 4 |
| Atraso do polling | 179 | 318 |

Simultaneidade (total; mediana / p95):

| Caso | 1 job | 2 jobs | 3 jobs |
| --- | --- | --- | --- |
| somador | 3270 / 3662 | 5309 / 6122 | 5323 / 8576 |
| contador 4 bits | 3296 / 3703 | 4940 / 5721 | 5715 / 8646 |
| pesado16 (fora do alvo) | 6122 / 6542 | 8180 / 11040 | 9027 / 19056 |

O terceiro job espera ~5 s na fila (`queueWaitMs` p95), o que confirma que o gargalo é o número de
slots do worker, não a CPU do `vvp`.

## 6. Conclusões

1. **Alvo atendido com um job por vez, na máquina de desenvolvimento**: p95 de 3,7 s para os
   exemplos, folga de 1,3 s. Não é uma conclusão sobre a VM B2s.
2. **A etapa de maior custo é o container, não a simulação**: compilar + simular somam ~20 ms; criar
   (~1,5 s) e iniciar/encerrar (~1 s) o container são ~2,5 s dos 3,3 s. O polling acrescenta ~0,2 s
   (até 0,4 s).
3. **Com dois jobs simultâneos a mediana passa de 5 s** (5,3 s no somador). O aumento vem de
   `containerCreateMs` (1,5 s → 2,6 s) e `executionMs`, não da fila — os dois jobs disputam o
   Docker. Isto não quebra o requisito de "condições normais" (um job por vez), mas mostra que ele
   vale só para pouca concorrência.
4. **Hipótese não verificada**: 1,5 s para `createContainer` é muito para um Docker nativo em
   Linux; o bind mount de um diretório do Windows através do WSL2 é o principal suspeito. Se a
   VM (Linux nativo) já for rápida aqui, RNF07-I02 não precisa mexer no container. Só se a medição
   na VM mostrar o container acima do orçamento vale otimizar (RNF07-I02).
5. Não medido: renderização no navegador (PR de front) e carregamento inicial da aplicação.

## 7. Pendências

- Repetir `measure:e2e` e `measure:sandbox` na VM B2s (após RF01-I02) e acrescentar as tabelas.
- Marcas do cliente (parse do VCD, primeiro desenho) e carregamento inicial: PR de front.

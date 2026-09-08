# RNF05 - Limites de tempo e de memoria por execucao de simulacao

| Campo | Valor |
| --- | --- |
| ID | RNF05 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Pipeline de compilacao e simulacao |
| Status | Implementado (falta verificar os desfechos e dimensionar os valores) |
| Requisitos relacionados | RF03, RF04, RNF04, RNF07 |

## 1. Enunciado

> Cada execucao de simulacao deve possuir limites de tempo e de consumo de
> memoria previamente definidos.

## 2. O que e

O conjunto de tetos aplicados a cada submissao, para que uma simulacao nunca
consuma recurso indefinidamente. Os valores ja existem e sao parametrizaveis por
`apps/api/src/config/env.ts`:

| Limite | Variavel | Padrao |
| --- | --- | --- |
| Tempo de simulacao | `SANDBOX_TIMEOUT_MS` | 10 000 ms |
| Memoria | `SANDBOX_MEMORY_MB` | 128 MB |
| CPU | `SANDBOX_CPUS` | 0,5 |
| Processos | fixo em `sandbox.ts` | `PidsLimit: 128` |
| Tamanho do fonte | `MAX_SOURCE_BYTES` | 256 KB por arquivo |
| Tamanho do VCD lido | `MAX_VCD_BYTES` | 8 MB |

A aplicacao acontece em duas camadas, e isso e proposital: o
`run-simulation.sh` aplica `timeout -s KILL` sobre o `vvp`, e `sandbox.ts` mantem
um `killTimer` com margem de 5 s sobre o mesmo limite - se o script falhar, o
host mata o container.

## 3. Para que serve

Um `always` sem controle de tempo e um erro comum de iniciante, nao um ataque.
Sem limite, uma unica submissao dessas ocupa um dos dois slots do worker
(`concurrency: 2`) para sempre, e duas param a plataforma para a turma inteira.

Os limites tambem sao o que torna previsivel o custo de operar na VM B2s de 4
GiB: com 128 MB e 0,5 CPU por execucao e dois jobs simultaneos, o consumo tem
teto conhecido.

E, junto com RNF04, e o que permite aceitar codigo arbitrario sem risco de
esgotamento de recurso.

## 4. Impacto

**Para o usuario.** Limite atingido precisa virar mensagem que ensina. "Tempo
limite excedido" sozinho nao diz que provavelmente falta um `$finish` ou que ha
um `always` sem `#`.

**Na fidelidade do desfecho.** `mapFailure` em `sandbox.ts` traduz o codigo de
saida em `SimulationFailure`. O caso de memoria e o mais fragil: o teste e
`exitCode === 137`, que e o codigo de qualquer processo morto por `SIGKILL` - o
mesmo que o `timeout -s KILL` do script produz. Distinguir estouro de memoria de
timeout depende de o script ja converter 137 em 124, o que ele faz apenas para o
`vvp`. Um processo morto pelo OOM killer em outro ponto pode ser reportado como
`memory_limit` sem ter estourado memoria - ou o contrario.

**No dimensionamento.** Os valores atuais foram escolhidos por bom senso, nao por
medicao. Dez segundos e generoso para os exemplos e curto para uma simulacao
longa legitima; 128 MB e confortavel para o `iverilog` em circuitos pequenos.
Falta o dado que justifique cada numero no texto do TCC.

## 5. Estado atual no repositorio

- `env.ts` declara e valida as tres variaveis, com padroes.
- `sandbox.ts` aplica `Memory`, `MemorySwap` (igual a `Memory`, sem swap),
  `NanoCpus` e `PidsLimit`, mais o `killTimer` com margem.
- `run-simulation.sh` aplica `timeout -s KILL "$TIMEOUT_S" vvp` e converte 137 em
  124.
- `mapFailure` mapeia 0, 2, 3, 124 e 137 para os valores de
  `SimulationFailureSchema`.
- O `iverilog` **nao** esta coberto por timeout no script - so o `vvp`.
- **Falta**: verificar que cada limite produz o desfecho correto, cobrir a
  compilacao, e dimensionar os valores com medicao.

## 6. Escopo

**Dentro**

- Verificacao de que cada limite dispara e produz o desfecho correto.
- Distincao confiavel entre timeout e estouro de memoria.
- Cobertura do `iverilog` pelo limite de tempo.
- Dimensionamento dos valores com base em medicao.

**Fora**

- Limites por usuario ou por turma (RF03-I02 trata de rate limit).
- Cota acumulada de uso.
- Ajuste dinamico de limite conforme a carga.
- Prioridade diferenciada na fila.

## 7. Criterios de aceite da feature

- [ ] Simulacao sem `$finish` termina no limite e reporta `timeout`.
- [ ] Alocacao acima do limite reporta `memory_limit`, nao `timeout`.
- [ ] Compilacao que nao termina tambem e interrompida.
- [ ] Um job nunca ocupa o worker alem do limite mais a margem.
- [ ] As mensagens ao usuario explicam a causa provavel e o que fazer.
- [ ] Os valores estao justificados por medicao, no `README.md`.
- [ ] Alterar as variaveis de ambiente muda o comportamento efetivo.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-verificacao-dos-limites.md) | Verificacao dos limites e fidelidade do desfecho | `chore/rnf05-verificacao-dos-limites` | M |
| [issue-02](issue-02-dimensionamento-dos-valores.md) | Dimensionamento dos valores com medicao | `chore/rnf05-dimensionamento-dos-valores` | M |

## 9. Dependencias

- Implementado junto com RNF04; verificado com RF03-I04 (observabilidade).
- Restringe RNF07 e define o teto de custo da VM.

## 10. Design

Sem interface propria. As mensagens de limite atingido pertencem a RF03 e RF04 -
ver `docs/requisitos/funcional/RF04/figma/WILL-BE-DONE.md`.

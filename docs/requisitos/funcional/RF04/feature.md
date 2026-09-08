# RF04 - Execucao da simulacao a partir de testbench fornecido pelo usuario

| Campo | Valor |
| --- | --- |
| ID | RF04 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Pipeline de compilacao e simulacao |
| Status | Parcial (executa; falta contrato de testbench e controle de saida) |
| Requisitos relacionados | RF02, RF03, RF05, RF06, RNF04, RNF05, RNF07 |

## 1. Enunciado

> A plataforma deve executar a simulacao do circuito descrito a partir de um
> testbench fornecido pelo usuario.

## 2. O que e

E a segunda metade do pipeline: depois de `iverilog` compilar (RF03), o `vvp`
executa o binario resultante e produz dois artefatos que o usuario consome -
o texto impresso pelo testbench (`$display`, `$monitor`) e o arquivo `.vcd` com a
evolucao dos sinais ao longo do tempo simulado.

A decisao arquitetural ja tomada e que **o testbench e do usuario**. A plataforma
nao gera estimulos, nao infere clock e nao define assercoes: ela recebe dois
arquivos (`design` e `testbench`, conforme `HdlSourcesSchema`) e executa. Isso e
deliberado - escrever testbench faz parte do que a disciplina ensina, e gerar
estimulo automatico transformaria a ferramenta em outra coisa.

O contrato de execucao esta em `infra/sandbox/run-simulation.sh`:

- compila todos os `.v`/`.sv` de `/work` com `iverilog -g2012`, **sem** `-s`,
  deixando a toolchain eleger como topo o modulo que ninguem instancia (o
  testbench);
- executa `timeout -s KILL "$TIMEOUT_S" vvp "$BIN"`;
- devolve `0` (sucesso), `2` (erro de compilacao), `3` (erro de execucao) ou
  `124` (timeout).

## 3. Para que serve

Compilar diz apenas que o codigo e valido. Simular diz se o circuito **faz o que
deveria**. Para quem esta aprendendo, e a simulacao que fecha o ciclo: escrever
um somador, aplicar as oito combinacoes de entrada e ver `sum` e `cout` mudarem e
o que transforma uma descricao textual em entendimento de hardware.

O `.vcd` produzido aqui e a materia-prima de RF06. O `$display` do testbench e o
que aparece no console de RF05. Sem RF04, os dois ficam vazios.

## 4. Impacto

**Para o usuario.** E o momento de verdade do fluxo. Tambem e a maior fonte de
frustracao potencial: um testbench sem `$finish` roda para sempre, um sem
`$dumpvars` produz simulacao correta e nenhuma forma de onda, e um `always`
sem controle de tempo trava. Sem orientacao explicita, o aluno interpreta esses
casos como falha da plataforma.

**Na plataforma.** Simulacao e a operacao mais cara e mais imprevisivel: o tempo
depende do que o usuario escreveu, nao do tamanho do arquivo. E o que justifica o
timeout duro de RNF05 e a fila de RF03.

**No volume de dados.** O `.vcd` cresce com o produto (numero de sinais x numero
de eventos). Um `$dumpvars(0, tb)` num testbench com clock de periodo curto e
simulacao longa gera dezenas de megabytes com facilidade - por isso `sandbox.ts`
ja limita a leitura por `MAX_VCD_BYTES`.

## 5. Estado atual no repositorio

- `infra/sandbox/run-simulation.sh` compila e executa, com timeout e codigos de
  saida definidos.
- `apps/api/src/modules/simulation/sandbox.ts` monta o container, coleta
  `stdout`/`stderr` via `demuxDockerLogs` e le o primeiro `.vcd` encontrado no
  workdir por `readVcd`.
- `apps/api/src/worker.ts` empacota o resultado no formato de
  `SimulationResultSchema`.
- `packages/shared/src/schemas/hdl.ts` define `topModule` como obrigatorio, mas o
  script **nao usa** esse valor: hoje ele e puramente informativo.
- **Falta**: validar que o testbench realmente instancia o `topModule`, avisar
  quando nao ha `$dumpfile`/`$dumpvars`, tratar simulacao sem `$finish`, limitar o
  volume de saida e dar feedback de progresso durante a execucao.

## 6. Escopo

**Dentro**

- Contrato explicito do testbench: o que a plataforma espera e o que avisa quando
  falta.
- Coerencia entre `topModule` declarado e o que o testbench instancia.
- Limites e truncamento controlado de `stdout` e do `.vcd`.
- Distincao clara, na interface, entre "na fila", "compilando" e "simulando", com
  possibilidade de desistir da espera.

**Fora**

- Geracao automatica de testbench ou de estimulos.
- Assercoes, cobertura funcional e execucao passo a passo (Won't Have).
- Multiplos arquivos de design alem de `design` + `testbench`.

## 7. Criterios de aceite da feature

- [ ] Um testbench valido com `$dumpfile`/`$dumpvars` produz `.vcd` nao vazio e
      `stdout` com o texto dos `$display`.
- [ ] Um testbench sem `$dumpvars` conclui com sucesso e a interface explica por
      que nao ha forma de onda, em vez de mostrar painel vazio sem contexto.
- [ ] Um testbench sem `$finish` termina por timeout e o usuario recebe
      `failure: 'timeout'` com explicacao acionavel.
- [ ] `topModule` incoerente com o testbench gera aviso antes de gastar container.
- [ ] Saida muito grande e truncada com aviso, sem quebrar o console nem o
      visualizador.
- [ ] O usuario consegue cancelar a espera por uma simulacao em andamento.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-contrato-testbench.md) | Contrato de testbench e coerencia do modulo de topo | `feat/rf04-contrato-testbench` | M |
| [issue-02](issue-02-limites-saida-simulacao.md) | Limites e truncamento da saida da simulacao | `feat/rf04-limites-saida-simulacao` | P |
| [issue-03](issue-03-estados-execucao-frontend.md) | Estados de execucao e cancelamento no frontend | `feat/rf04-estados-execucao-frontend` | M |

## 9. Dependencias

- Depende de RF03 (fila, sandbox e imagem `tplab-sandbox:latest`).
- Bloqueia RF06 (sem `.vcd` nao ha o que renderizar) e alimenta RF05.
- Restringido por RNF05 (timeout e memoria) e RNF07 (tempo de resposta).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

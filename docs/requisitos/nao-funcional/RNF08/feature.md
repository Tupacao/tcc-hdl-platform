# RNF08 - Arquitetura modular para sintese logica e FPGA

| Campo | Valor |
| --- | --- |
| ID | RNF08 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Pipeline de compilacao e simulacao |
| Status | Parcial (o desenho preve; nada foi exercitado) |
| Requisitos relacionados | RF03, RF04, RNF04, RNF05 |

## 1. Enunciado

> A arquitetura da plataforma deve ser modular, permitindo a integracao futura
> com servicos de sintese logica e gravacao em dispositivos FPGA.

## 2. O que e

O compromisso de que a plataforma possa receber, no futuro, outras toolchains -
GHDL para VHDL, Yosys para sintese, nextpnr para posicionamento e roteamento -
**sem** redesenho. Sintese e FPGA estao explicitamente fora do MVP; o que RNF08
exige e que a porta fique aberta.

O desenho ja adotado atende em intencao: a fila e por tipo de job, o sandbox
recebe fontes e devolve artefatos, e a API nao sabe qual ferramenta roda la
dentro. `CLAUDE.md` registra a expectativa - "GHDL (VHDL) e Yosys entram como
novos jobs, sem mudar a API".

A diferenca entre intencao e realidade e o objeto desta feature. Hoje o pipeline
tem uma unica toolchain, e varias suposicoes sobre ela estao espalhadas pelo
codigo sem estarem visiveis:

- `HdlLanguageSchema` e `z.enum(['verilog'])` - uma linguagem;
- `run-simulation.sh` chama `iverilog` e `vvp` diretamente;
- `parseIcarusDiagnostics` entende o formato do Icarus;
- `SimulationResultSchema` assume que o artefato de saida e um `.vcd`;
- os codigos de saida 0/2/3/124 sao especificos desse script;
- a fila tem um unico nome (`tplab-simulation`) e o worker um unico processador.

Nenhuma dessas escolhas esta errada. O ponto e que "modular" so e verdade se
adicionar a segunda toolchain nao exigir tocar em todas elas.

## 3. Para que serve

Sintese e FPGA sao a continuacao natural do trabalho, e o TCC menciona isso como
evolucao. Uma arquitetura que exija reescrever o pipeline para acomoda-las
inviabiliza a continuidade - e transforma o MVP em beco sem saida.

Para o texto do trabalho, RNF08 tambem sustenta a afirmacao de que a proposta e
extensivel. Afirmacao que so se sustenta com demonstracao.

## 4. Impacto

**Na estrutura do job.** `CompileRequestSchema` descreve uma submissao de
simulacao Verilog. Uma submissao de sintese teria outros parametros (dispositivo
alvo, restricoes) e outros artefatos (netlist, relatorio de recursos, bitstream).
O contrato precisa acomodar isso sem virar um objeto com tudo opcional.

**No sandbox.** `runInSandbox` recebe `HdlSources` e devolve `SandboxOutcome` com
`stdout`, `stderr` e `vcd`. Generalizar significa: a imagem vem do tipo de job, e
os artefatos sao uma colecao nomeada, nao um campo fixo por tipo de saida.

**Nos diagnosticos.** `DiagnosticSchema` e generico o bastante para servir a
qualquer ferramenta - e um bom exemplo de acerto do desenho atual. O parser e que
e especifico, e precisa ser selecionado pelo tipo de job.

**No custo de fazer isso agora.** Generalizar cedo tem o risco oposto: abstrair
para um caso hipotetico produz complexidade sem beneficio. O equilibrio adotado
aqui e provar a extensibilidade com **uma** segunda toolchain real, e deixar o
resto documentado - abstracao validada por um caso concreto, nao por suposicao.

## 5. Estado atual no repositorio

- Fila unica `tplab-simulation`, um worker com um processador
  (`apps/api/src/worker.ts`).
- `sandbox.ts` recebe `HdlSources` e usa `env.SANDBOX_IMAGE` fixo.
- `run-simulation.sh` codifica `iverilog` e `vvp`.
- `diagnostics.ts` entende o formato do Icarus.
- `HdlLanguageSchema` admite apenas `verilog`.
- O comentario em `queue.ts` e a nota em `CLAUDE.md` registram a intencao.
- **Falta**: generalizar o tipo de job e comprovar com uma segunda toolchain.

## 6. Escopo

**Dentro**

- Generalizacao do job por tipo de toolchain.
- Selecao de imagem, script e parser de diagnostico pelo tipo.
- Artefatos nomeados no lugar do campo fixo `vcd`.
- Prova de conceito com uma segunda toolchain, sem alterar as rotas.
- Documentacao do procedimento para adicionar uma nova.

**Fora**

- Sintese logica de verdade (Yosys, nextpnr) - Won't Have.
- Gravacao em FPGA - Won't Have.
- Suporte completo a VHDL como funcionalidade de produto.
- Interface para escolher toolchain (a prova de conceito nao precisa de tela).

## 7. Criterios de aceite da feature

- [ ] O tipo de job faz parte do contrato e determina imagem, script e parser.
- [ ] Os artefatos sao uma colecao nomeada, nao um campo por tipo de saida.
- [ ] Adicionar uma toolchain nao exige alterar `routes.ts`.
- [ ] Ha uma segunda toolchain funcionando de ponta a ponta.
- [ ] O fluxo Verilog continua identico, sem regressao.
- [ ] O procedimento para adicionar uma toolchain esta documentado.
- [ ] Os acoplamentos citados em `CLAUDE.md` continuam validos ou foram
      atualizados.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-generalizacao-do-job.md) | Generalizacao do job por tipo de toolchain | `feat/rnf08-generalizacao-do-job` | G |
| [issue-02](issue-02-prova-de-conceito-ghdl.md) | Prova de conceito com uma segunda toolchain | `feat/rnf08-prova-de-conceito-ghdl` | M |

## 9. Dependencias

- Depende de RF03 e RF04 estaveis.
- Restringido por RNF04 e RNF05: toolchain nova roda com o mesmo isolamento e os
  mesmos limites.

## 10. Design

Sem interface propria. A prova de conceito nao precisa de tela; se a segunda
toolchain virar funcionalidade, a escolha de linguagem entra em RF02 e RF07.

# RF21 - Componentes sequenciais basicos no editor visual

| Campo | Valor |
| --- | --- |
| ID | RF21 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Could Have |
| Epico | Editor visual |
| Status | Nao implementado |
| Requisitos relacionados | RF12, RF13, RF20, RNF01 |

## 1. Enunciado

> O editor visual de circuitos deve suportar componentes sequenciais basicos,
> como flip-flops.

## 2. O que e

A extensao do editor visual de RF12 - restrito a combinacionais - para incluir
elementos com memoria: flip-flop tipo D, sinal de clock e reset. Com isso o
usuario passa a montar registradores, contadores e maquinas simples no canvas, e
RF13 passa a gerar `always @(posedge clk)` alem de `assign`.

E uma mudanca conceitual, nao apenas mais um bloco na paleta. Circuito
combinacional e uma funcao pura da entrada; circuito sequencial tem estado, e
isso muda tres coisas de uma vez:

1. **Ciclos passam a ser legitimos.** A realimentacao que RF12-I02 detecta como
   erro e exatamente o que faz um contador funcionar - desde que atravesse um
   flip-flop.
2. **Aparece o clock**, um sinal com papel especial, que nao e uma entrada
   qualquer.
3. **A geracao de codigo muda de forma**: blocos procedurais com atribuicao nao
   bloqueante, em vez de atribuicoes continuas.

## 3. Para que serve

Circuitos puramente combinacionais cobrem a primeira metade de uma disciplina de
sistemas digitais. Sem sequenciais, o editor visual para justamente onde o
conteudo fica interessante - contadores, registradores, maquinas de estado.

Do ponto de vista pedagogico, ver o flip-flop desenhado, com o clock chegando,
e depois ver o `always @(posedge clk)` correspondente (RF13) e a ponte mais
direta entre o diagrama do quadro e o codigo HDL.

## 4. Impacto

**Para o usuario.** Amplia o editor visual para o conteudo que realmente exige
apoio visual.

**Na validacao do grafo.** A regra "ciclo e erro" de RF12-I02 precisa passar a
distinguir realimentacao que atravessa elemento de memoria (valida) de
realimentacao puramente combinacional (invalida). E a mudanca mais delicada da
feature, e a que justifica RF21 vir depois de RF12 estar estavel.

**Na geracao de codigo.** RF13 ganha um segundo modo de emissao. A representacao
intermediaria de RF13-I01 precisa acomodar registradores, e a ordenacao
topologica passa a valer apenas para a parte combinacional - o estado quebra a
dependencia entre ciclos.

**No escopo.** O enunciado diz "basicos, como flip-flops". A tentacao e crescer
para latches, JK, T, memorias e maquinas de estado. Manter o flip-flop D com
reset como nucleo, e tratar o resto como fora do MVP, e o que mantem a feature
possivel.

**Na prioridade.** Could Have que depende de duas Should Have (RF12 e RF13). Na
pratica, so entra se aquelas estiverem completas e sobrar prazo.

## 5. Estado atual no repositorio

- RF12 e RF13 nao existem; RF21 nao tem base sobre a qual construir.
- `apps/web/src/lib/samples.ts` tem apenas o somador, combinacional; o contador
  previsto em RF20-I01 sera a referencia de codigo sequencial correto.
- **Falta**: tudo, e as duas features anteriores.

## 6. Escopo

**Dentro**

- Flip-flop tipo D com clock e reset como bloco do canvas.
- Blocos de clock e reset como entradas com papel proprio.
- Validacao que aceita realimentacao atraves de elemento de memoria.
- Geracao de Verilog sequencial correspondente.

**Fora**

- Latches, flip-flops JK/T/SR.
- Memorias, RAM e ROM.
- Editor de maquina de estados.
- Analise de temporizacao ou dominio de clock multiplo.
- Simulacao passo a passo dentro do canvas (Won't Have).

## 7. Criterios de aceite da feature

- [ ] E possivel montar um contador de 4 bits no canvas.
- [ ] O flip-flop tem entradas de dado, clock e reset, e saida.
- [ ] Realimentacao atraves de flip-flop nao e reportada como erro.
- [ ] Realimentacao puramente combinacional continua sendo erro.
- [ ] O codigo gerado usa `always @(posedge clk)` com atribuicao nao bloqueante.
- [ ] O codigo gerado compila e simula com o testbench do contador de RF20.
- [ ] O clock e visualmente distinguivel dos demais sinais.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-blocos-sequenciais-e-clock.md) | Blocos sequenciais, clock e validacao com memoria | `feat/rf21-blocos-sequenciais-e-clock` | G |
| [issue-02](issue-02-geracao-verilog-sequencial.md) | Geracao de Verilog sequencial | `feat/rf21-geracao-verilog-sequencial` | M |

## 9. Dependencias

- Depende inteiramente de RF12 (canvas e validacao) e RF13 (geracao).
- Usa o contador de RF20-I01 como referencia e como teste de equivalencia.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

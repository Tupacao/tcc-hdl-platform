# RF12 - Modelagem visual de circuitos combinacionais por blocos logicos

| Campo | Valor |
| --- | --- |
| ID | RF12 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Should Have |
| Epico | Editor visual |
| Status | Nao implementado |
| Requisitos relacionados | RF13, RF21, RF07, RF09, RNF01, RNF03, RNF09 |

## 1. Enunciado

> A plataforma deve permitir a modelagem visual de circuitos digitais
> combinacionais por meio de um editor baseado em blocos logicos, a semelhanca do
> CircuitVerse.

## 2. O que e

Um canvas onde o usuario monta um circuito arrastando portas logicas (AND, OR,
NOT, XOR, NAND, NOR), entradas, saidas e constantes, e ligando os terminais com
fios. E a terceira forma de descrever hardware na plataforma, ao lado do codigo
Verilog - e, para quem esta comecando, a mais proxima do que ja se viu no quadro.

O modelo de dados e um grafo direcionado: nos (portas e terminais, cada um com
posicao e configuracao) e arestas (ligacoes de um terminal de saida a um de
entrada). Esse mesmo grafo e o que RF13 traduz para Verilog.

A base tecnica prevista em `docs/PROJECT_CONTEXT.md` e **React Flow**, com a UX
inspirada no CircuitVerse.

## 3. Para que serve

Existe uma distancia grande entre entender uma tabela verdade e escrever
`assign sum = a ^ b ^ cin;`. O editor visual encurta essa distancia: o aluno monta
o circuito com o vocabulario que ja tem - portas e fios - e so depois ve o codigo
correspondente (RF13).

E o pilar "CircuitVerse" das tres referencias do TCC, e o que diferencia o TPLab
do EDA Playground, que so tem texto.

## 4. Impacto

**Para o usuario.** Abre a plataforma para quem ainda nao consegue escrever HDL.
Torna visivel a correspondencia entre desenho e codigo.

**No escopo.** E a maior feature Should Have do projeto e a mais facil de crescer
sem controle. O enunciado limita a **combinacionais**; sequenciais sao RF21, e
mesmo la ficam restritos a flip-flops basicos. Manter essa fronteira e o que
mantem RF12 viavel no prazo.

**Na arquitetura do frontend.** Introduz React Flow, uma dependencia grande, e um
segundo modelo de dados de projeto - o circuito - que precisa conviver com
`HdlSourcesSchema` no `ProjectSchema` (RF07). Decidir como os dois coexistem e
parte desta feature.

**Na integracao com o pipeline.** O circuito nao e simulavel por si: ele vira
Verilog (RF13) e segue pelo mesmo caminho de RF03/RF04. Nada muda no backend -
o que confirma o desenho modular de RNF08.

**No espaco de tela.** Um quarto painel nao cabe em 1024px junto com os outros
tres. A solucao provavel e um modo alternativo do painel de edicao (codigo ou
circuito), e nao mais uma divisao.

## 5. Estado atual no repositorio

- Nao ha React Flow nem qualquer dependencia de canvas em `apps/web/package.json`.
- `ProjectSchema` (`packages/shared/src/schemas/project.ts`) contem apenas
  `sources: HdlSourcesSchema` - nao ha lugar para guardar um circuito.
- `workspace.tsx` assume codigo como unica forma de entrada.
- **Falta**: tudo - modelo de dados, canvas, biblioteca de blocos, persistencia e
  integracao com a interface.

## 6. Escopo

**Dentro**

- Canvas com adicionar, mover, remover e conectar blocos.
- Biblioteca de portas combinacionais: AND, OR, NOT, XOR, NAND, NOR, mais
  entrada, saida e constante.
- Validacao do grafo: entrada nao conectada, saida sem origem, ciclo,
  multiplos drivers no mesmo no.
- Persistencia do circuito junto ao projeto.
- Integracao na interface sem quebrar o layout de RF09.

**Fora**

- Componentes sequenciais (RF21).
- Simulacao direta do circuito no canvas (o caminho e via RF13).
- Sub-circuitos, hierarquia e componentes personalizados.
- Importar circuito de outra ferramenta.
- Roteamento automatico de fios com desvio de obstaculos.

## 7. Criterios de aceite da feature

- [ ] O usuario monta um somador completo no canvas, com entradas, portas e
      saidas.
- [ ] Conectar terminais incompativeis (saida com saida) e impedido.
- [ ] Entradas nao conectadas e ciclos sao sinalizados sem impedir a edicao.
- [ ] O circuito e salvo com o projeto e restaurado ao reabrir.
- [ ] O canvas e utilizavel a partir de 1024px de largura.
- [ ] Adicionar e conectar blocos e possivel pelo teclado.
- [ ] Alternar entre codigo e circuito nao perde nenhum dos dois.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-canvas-e-biblioteca-blocos.md) | Canvas React Flow e biblioteca de blocos logicos | `feat/rf12-canvas-e-biblioteca-blocos` | G |
| [issue-02](issue-02-conexoes-e-validacao-grafo.md) | Conexoes, terminais e validacao do grafo | `feat/rf12-conexoes-e-validacao-grafo` | G |
| [issue-03](issue-03-persistencia-circuito.md) | Modelo e persistencia do circuito no projeto | `feat/rf12-persistencia-circuito` | M |
| [issue-04](issue-04-integracao-workspace.md) | Integracao do editor visual no workspace | `feat/rf12-integracao-workspace` | M |

## 9. Dependencias

- Depende de RF07 (projeto persistido) para salvar o circuito.
- Bloqueia RF13 (geracao de codigo) e RF21 (sequenciais).
- Restringido por RNF03 (1024px) e RNF09 (acessibilidade de canvas).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

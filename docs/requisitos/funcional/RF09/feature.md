# RF09 - Editor, compilador, simulador e visualizador em interface unica

| Campo | Valor |
| --- | --- |
| ID | RF09 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Experiencia integrada |
| Status | Concluido - I01 (layout), I02 (atalhos) e I03 (semantica e barra de estado) |
| Requisitos relacionados | RF02, RF05, RF06, RF07, RF10, RNF01, RNF03, RNF09 |

## 1. Enunciado

> O editor de codigo, o compilador, o simulador e o visualizador de formas de
> onda devem ser integrados em uma unica interface.

## 2. O que e

E o requisito que define a forma do produto. Nao pede uma funcionalidade nova:
pede que as quatro capacidades ja exigidas por RF02, RF03, RF04 e RF06 estejam
na mesma tela, sem troca de contexto, sem upload de arquivo entre etapas e sem
janela separada.

Na pratica isso e o `Workspace`
(`apps/web/src/features/workspace/workspace.tsx`), com tres paineis
redimensionaveis: editor (com abas de arquivo), console de saida e visualizador
de formas de onda, mais um cabecalho com a acao de executar.

## 3. Para que serve

O ciclo de aprendizado de HDL e curto e repetitivo: escrever, compilar, olhar o
erro, corrigir, simular, olhar a onda, ajustar. Toda friccao entre esses passos e
paga muitas vezes por aula. Nas ferramentas tradicionais o ciclo atravessa
janelas, projetos e ferramentas distintas - no Vivado, ver a forma de onda exige
abrir outra perspectiva.

Interface unica e o que permite ver o erro **ao lado** do codigo que o causou, e a
onda **ao lado** do testbench que a gerou. E a materializacao do argumento
pedagogico do TCC.

## 4. Impacto

**Para o usuario.** Menos cliques, menos contexto perdido, curva de aprendizado
menor - a interface se explica sozinha (RNF01).

**Na arquitetura do frontend.** Concentra estado: `sources`, `result`, `error` e
`isRunning` vivem no `Workspace` e descem por props. E uma escolha deliberada e
adequada ao tamanho atual; se o estado crescer (projeto aberto em RF07-I03,
selecao de sinais em RF06-I03, editor visual em RF12), a decisao precisa ser
revisitada de forma consciente, e nao por acumulo.

**No espaco de tela.** Tres paineis simultaneos e a razao do minimo de 1024px de
RNF03. Hoje o `Workspace` impoe `min-w-[1024px]`, o que gera rolagem horizontal
em tela menor - solucao provisoria que RNF03 precisa reavaliar.

**Na integracao.** RF09 e quem garante que as pecas conversem: clicar no
diagnostico posiciona o editor (RF05-I02); simular atualiza console e ondas
juntos; o tema vale para tudo (RF10).

## 5. Estado atual no repositorio

- `workspace.tsx` monta `PanelGroup` horizontal (editor+console | ondas) com um
  `PanelGroup` vertical aninhado, usando `react-resizable-panels`.
- Tamanhos iniciais fixos: 58/42 na horizontal, 70/30 na vertical; nada e
  persistido entre sessoes.
- Cabecalho com titulo, badge "Verilog", botao "Executar" e `ThemeToggle`.
- Abas de arquivo implementadas com `role="tablist"`/`role="tab"`, mas sem
  `aria-controls`, sem `tabpanel` e sem navegacao por setas.
- `ResizeHandle` estiliza o divisor, mas nao tem rotulo acessivel.
- Alturas de painel calculadas com `h-[calc(100%-1.75rem)]`, acopladas a altura
  do cabecalho de cada painel.
- **Falta**: persistencia do layout, atalhos de teclado, semantica correta das
  abas e do redimensionamento, e uma barra de estado unificada.

## 6. Escopo

**Dentro**

- Persistir tamanhos de painel e restaurar na proxima sessao, com opcao de
  restaurar o padrao.
- Atalhos de teclado para o ciclo principal e sua documentacao visivel.
- Corrigir a semantica das abas e do redimensionamento por teclado.
- Barra de estado com o resultado da ultima execucao, visivel de qualquer painel.

**Fora**

- Layout configuravel arrastando paineis para outras posicoes.
- Paineis destacaveis em janela propria.
- Adaptacao para telas abaixo de 1024px (RNF03).
- Modo de foco / tela cheia por painel.

## 7. Criterios de aceite da feature

- [x] As quatro capacidades continuam acessiveis sem sair da tela.
- [x] Os tamanhos de painel sobrevivem a um recarregamento. _(I01)_
- [x] Existe acao para restaurar o layout padrao. _(I01)_
- [x] O ciclo escrever, executar, ler erro, corrigir e possivel so pelo teclado. _(I02)_
- [x] Os divisores sao ajustaveis por teclado e tem rotulo acessivel. _(I03)_
- [x] As abas seguem o padrao ARIA de tabs, com navegacao por setas. _(I03)_
- [x] Uma barra de estado mostra o desfecho da ultima execucao. _(I03)_
- [x] Os atalhos estao documentados dentro da propria aplicacao. _(I02)_

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho | Status |
| --- | --- | --- | --- | --- |
| [issue-01](issue-01-persistencia-layout-paineis.md) | Persistencia e restauracao do layout dos paineis | `feat/rf09-persistencia-layout-paineis` | P | Concluido |
| [issue-02](issue-02-atalhos-teclado-fluxo.md) | Atalhos de teclado do fluxo principal | `feat/rf09-atalhos-teclado-fluxo` | M | Concluido |
| [issue-03](issue-03-semantica-e-barra-de-estado.md) | Semantica das abas, divisores e barra de estado | `feat/rf09-semantica-e-barra-de-estado` | M | Concluido |

## 9. Dependencias

- Integra RF02, RF05 e RF06; conversa diretamente com RF07-I03 (projeto no
  cabecalho) e RF10 (tema).
- Restringido por RNF01, RNF03 e RNF09.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

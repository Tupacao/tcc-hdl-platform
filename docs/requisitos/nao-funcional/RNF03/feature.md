# RNF03 - Interface responsiva, minimo recomendado de 1024 pixels

| Campo | Valor |
| --- | --- |
| ID | RNF03 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Experiencia integrada |
| Status | Parcial (funciona acima de 1024px; abaixo ha rolagem horizontal) |
| Requisitos relacionados | RF09, RF06, RF12, RNF01, RNF02 |

## 1. Enunciado

> A interface deve ser responsiva, com resolucao minima recomendada de 1024
> pixels de largura.

## 2. O que e

O compromisso de que a interface se adapta ao espaco disponivel, com 1024px como
piso **recomendado** - a largura de um notebook comum e o menor tamanho em que
os tres paineis de RF09 convivem de forma util.

O enunciado usa "recomendada", nao "minima absoluta". Isso tem consequencia
pratica: abaixo de 1024px a plataforma nao precisa ser confortavel, mas tambem
nao deveria simplesmente quebrar sem explicacao.

Ha duas leituras possiveis do que fazer abaixo do piso:

1. **rolagem horizontal** - o que o codigo faz hoje, via `min-w-[1024px]`;
2. **layout adaptado** - empilhar os paineis ou mostrar um de cada vez.

A segunda e mais trabalhosa e mais util; a escolha e da feature.

## 3. Para que serve

O parque de maquinas do publico-alvo nao e uniforme: notebooks de 1366x768,
monitores de laboratorio em 1024x768, telas grandes em casa. Uma interface
pensada para uma unica largura desperdica espaco na maior e quebra na menor.

O limite de 1024px tambem e uma decisao de escopo honesta: escrever HDL em tela
de celular nao e caso de uso real, e fingir que e custaria caro sem beneficio.

## 4. Impacto

**Para o usuario.** Poder usar a ferramenta na maquina que tem.

**No layout.** Tres paineis simultaneos e o que torna 1024px apertado. As
decisoes que decorrem disso: larguras minimas por painel, o que acontece quando a
soma nao cabe, e o que fazer com o quarto painel de RF12 (que ja levou a decisao
de alternar modos em vez de dividir mais).

**No que ja existe.** `workspace.tsx` usa `min-w-[1024px]`, o que garante que o
layout nunca quebra e produz rolagem horizontal em telas menores - solucao
provisoria consciente, que esta feature precisa confirmar ou substituir.

**Na relacao com RNF02.** Responsividade e compatibilidade se verificam juntas:
a mesma sessao de teste cobre navegador e largura.

## 5. Estado atual no repositorio

- `apps/web/src/features/workspace/workspace.tsx` aplica
  `flex h-full min-w-[1024px] flex-col` - o piso e um minimo rigido, nao um
  ponto de adaptacao.
- Os paineis usam `defaultSize` percentual com `minSize` (30/15/20), o que ja da
  adaptacao proporcional acima do piso.
- `apps/web/src/index.css` define `height: 100%` em `html`, `body` e `#root`, com
  o comentario citando RNF03.
- `apps/web/index.html` tem a metatag `viewport` padrao.
- Alturas de painel calculadas com `h-[calc(100%-1.75rem)]`, acopladas a altura
  fixa dos cabecalhos - RF09-I03 preve substituir por flex.
- Nao ha nenhum ponto de quebra (breakpoint) declarado.
- **Falta**: verificar em larguras reais e decidir o comportamento abaixo do piso.

## 6. Escopo

**Dentro**

- Verificacao e ajuste do layout em 1024, 1366, 1920 e larguras intermediarias.
- Definicao do comportamento abaixo de 1024px.
- Larguras e alturas minimas coerentes por painel.
- Comportamento em telas muito largas (evitar linha de leitura excessiva na
  documentacao de RF11).

**Fora**

- Layout para celular e tablet em retrato.
- Interface tactil.
- Aplicativo movel.
- Redesenho da estrutura de paineis (RF09).

## 7. Criterios de aceite da feature

- [ ] Em 1024px os tres paineis sao utilizaveis sem rolagem horizontal.
- [ ] Em 1366px e 1920px o espaco extra e aproveitado, sem elemento esticado
      demais.
- [ ] Abaixo de 1024px o comportamento e o definido pela feature, e nao um
      acidente.
- [ ] Nenhum painel pode ser reduzido a um tamanho inutilizavel.
- [ ] Redimensionar a janela nao quebra o layout nem o editor.
- [ ] O canvas de RF12 e utilizavel em 1024px.
- [ ] O comportamento esperado por faixa de largura esta documentado.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-verificacao-larguras-alvo.md) | Verificacao e ajuste nas larguras alvo | `chore/rnf03-verificacao-larguras-alvo` | M |
| [issue-02](issue-02-comportamento-abaixo-do-minimo.md) | Comportamento abaixo da largura minima | `feat/rnf03-comportamento-abaixo-do-minimo` | M |

## 9. Dependencias

- Depende de RF09 (estrutura de paineis) e conversa com RF06 e RF12, os
  componentes que mais precisam de largura.
- Verificado junto com RNF02.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

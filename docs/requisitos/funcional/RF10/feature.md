# RF10 - Alternancia entre modo claro e escuro

| Campo | Valor |
| --- | --- |
| ID | RF10 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Experiencia integrada |
| Status | Parcial - I01 (seletor dos tres modos) concluida; I02 (anti-flash) pendente |
| Requisitos relacionados | RF02, RF06, RF09, RNF09 |

## 1. Enunciado

> A plataforma deve oferecer alternancia entre os modos claro e escuro.

## 2. O que e

Um controle que troca a paleta da aplicacao inteira - interface, editor de codigo
e visualizador de formas de onda - com a escolha preservada entre sessoes.

A implementacao ja adotada e a padrao do shadcn/ui: tokens de cor como variaveis
CSS em `:root`, sobrescritos em `.dark`, com a classe aplicada ao
`document.documentElement`. Tailwind v4 le esses tokens via `@theme inline`, o
que faz `bg-background` e `text-foreground` funcionarem nos dois modos sem
duplicar classe.

O provedor (`apps/web/src/components/theme-provider.tsx`) ja modela **tres**
estados - `light`, `dark` e `system` - e resolve `system` observando
`prefers-color-scheme` em tempo real.

## 3. Para que serve

Programar e uma atividade de olhar para texto por horas. A preferencia por tema
escuro entre desenvolvedores nao e estetica: e conforto visual em ambiente com
pouca luz. Ao mesmo tempo, laboratorio com projetor e sala clara pedem o
contrario.

Ha ainda o argumento de acessibilidade: parte dos usuarios com sensibilidade a
luz ou com certas condicoes visuais depende de um dos modos. Por isso RNF09 exige
contraste AA nos **dois**, e nao apenas no principal.

## 4. Impacto

**Para o usuario.** Conforto e respeito a preferencia ja expressa no sistema
operacional.

**Na arquitetura visual.** Impoe a regra de nunca usar cor literal no codigo:
tudo passa por token. Cada cor nova precisa de par claro/escuro definido em
`index.css`. Isso vale tambem para os componentes que nao sao HTML comum - o
Monaco tem tema proprio (RF02-I02) e o canvas de formas de onda desenha com cores
lidas dos tokens (RF06-I02).

**Na percepcao de qualidade.** Um flash branco no carregamento, ou um painel que
fica claro enquanto o resto escurece, e o tipo de defeito que derruba a impressao
da ferramenta em uma demonstracao.

## 5. Estado atual no repositorio

- `apps/web/src/index.css`: tokens completos em `:root` e `.dark`, incluindo
  `--success` e `--warning` alem dos do preset slate do shadcn/ui, expostos ao
  Tailwind por `@theme inline`. `@custom-variant dark` amarra a variante a classe
  `.dark`.
- `theme-provider.tsx`: le `localStorage` (`tplab-theme`), observa
  `prefers-color-scheme`, aplica a classe e define `root.style.colorScheme`.
  Trata `localStorage` indisponivel com `try/catch`.
- `theme-toggle.tsx`: botao que alterna **apenas** entre `light` e `dark` -
  escolhido um deles, o usuario nao tem como voltar a `system` pela interface.
- `apps/web/index.html`: `<html lang="pt-BR" class="dark">` com a classe fixa no
  HTML e nenhum script anterior a hidratacao.
- `code-editor.tsx`: mapeia `resolvedTheme` para `vs`/`vs-dark`.
- **Falta**: expor o modo "sistema", evitar o flash de tema errado no
  carregamento e cobrir os componentes que ainda nao existem (RF06).

## 6. Escopo

**Dentro**

- Controle com os tres estados: claro, escuro e sistema.
- Aplicacao do tema antes da primeira pintura, sem flash.
- Cobertura de todos os componentes, incluindo Monaco e canvas.

**Fora**

- Temas adicionais ou personalizacao de cores pelo usuario.
- Tema de alto contraste (fora do escopo do MVP; RNF09 trata do contraste AA).
- Sincronizacao da preferencia entre dispositivos (dependeria de RF14).

## 7. Criterios de aceite da feature

- [x] O controle permite escolher claro, escuro e sistema. _(I01)_
- [x] Com "sistema", mudar a preferencia do SO muda o tema sem recarregar. _(I01)_
- [x] A escolha sobrevive a recarga e a fechar o navegador. _(I01)_
- [ ] Nao ha flash de tema incorreto no carregamento, em nenhum dos tres modos.
- [ ] Editor, console e visualizador de ondas acompanham o tema.
- [ ] Nenhuma cor literal fora dos tokens de `index.css`.
- [ ] O contraste atende AA nos dois modos (verificado em RNF09).

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho | Status |
| --- | --- | --- | --- | --- |
| [issue-01](issue-01-seletor-tres-modos.md) | Seletor de tema com os tres modos | `feat/rf10-seletor-tres-modos` | P | Concluido |
| [issue-02](issue-02-anti-flash-carregamento.md) | Aplicar o tema antes da primeira pintura | `feat/rf10-anti-flash-carregamento` | P | Pendente |

## 9. Dependencias

- Independente de backend.
- Amarrado a RF02-I02 (tema do Monaco) e RF06-I02 (cores do canvas).
- Verificado por RNF09.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

# RF20-I02 - Seletor de exemplos na interface

| Campo | Valor |
| --- | --- |
| Feature | [RF20](feature.md) |
| Branch | `feat/rf20-seletor-de-exemplos` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | RF20-I01 |

## Contexto

Hoje o exemplo do somador e o estado inicial do `Workspace`, sem escolha
possivel: `useState<HdlSources>(SAMPLE_SOURCES)`. Com o catalogo de RF20-I01,
falta a interface que permite escolher.

O ponto delicado e o que acontece com o que ja esta na tela. Abrir um exemplo
substitui o conteudo do editor, e fazer isso sem perguntar destroi trabalho.

## Objetivo

Permitir escolher e abrir qualquer exemplo do catalogo, sem perder trabalho em
andamento.

## Escopo tecnico

- `apps/web/src/features/samples/sample-gallery.tsx` (novo)
- `apps/web/src/features/workspace/workspace.tsx` - carregar exemplo
- `apps/web/src/features/workspace/workspace-header.tsx` - ponto de acesso
- `apps/web/src/features/projects/` - criar projeto a partir de exemplo

## Passo a passo

1. Construir a galeria com um cartao por exemplo: titulo, descricao, conceitos e
   dificuldade, conforme o design.
2. Abrir a galeria a partir de tres lugares: cabecalho do workspace, lista de
   projetos vazia (RF07-I02) e dialogo de criar projeto.
3. Ao abrir um exemplo com conteudo diferente do padrao na tela, pedir
   confirmacao, oferecendo salvar como projeto antes (quando RF07 existir).
4. Deixar visivel no workspace que o conteudo aberto e um exemplo, e o que
   acontece ao edita-lo - conforme a decisao do design de RF20.
5. Criar projeto a partir de exemplo: preencher nome e descricao com os
   metadados, deixando o usuario ajustar antes de salvar.
6. Manter o comportamento atual de primeiro acesso - a plataforma abre com um
   exemplo carregado, o que sustenta RF01 e RF16.
7. Acessibilidade: galeria navegavel por teclado, cartoes com `aria-label`
   completo, foco visivel, e o dialogo com foco preso e retorno de foco.

## Criterios de aceite

- [ ] Qualquer exemplo do catalogo abre em ate dois cliques.
- [ ] Abrir um exemplo com trabalho na tela pede confirmacao.
- [ ] A galeria e alcancavel dos tres pontos previstos.
- [ ] Criar projeto a partir de exemplo preenche nome e descricao.
- [ ] Fica claro no workspace quando o conteudo e um exemplo.
- [ ] O primeiro acesso continua abrindo com um exemplo carregado.
- [ ] A galeria e operavel apenas por teclado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: abrir cada exemplo e executar; editar, tentar abrir outro e conferir a
confirmacao.

## Riscos

- Confirmar toda vez, inclusive quando o conteudo e o exemplo padrao intocado,
  vira ruido; comparar com o conteudo original antes de perguntar.
- Sem RF07, "salvar antes de trocar" nao tem para onde salvar; nesse caso oferecer
  exportar (RF08) ou apenas avisar.

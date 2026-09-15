# RF11-I01 - Navegacao e layout da documentacao

| Campo | Valor |
| --- | --- |
| Feature | [RF11](feature.md) |
| Branch | `feat-RF11-01-navegacao-e-layout-docs-front` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

`apps/web/src/App.tsx` renderiza `<Workspace />` diretamente, sem roteador. RF11
introduz a segunda superficie de conteudo da aplicacao (RF07-I02 introduz a
terceira), e a forma como ela entra na tela precisa ser decidida uma unica vez.

Esta issue entrega a **estrutura**; os textos vem em RF11-I02 e RF11-I03.

**A decisao de navegacao ja estava fechada no Figma** (`figma/WILL-BE-DONE.md`:
"documentacao e pagina propria"), o que so foi notado depois de uma primeira
implementacao (painel `Sheet` sobreposto ao workspace) ter sido revisada e
descartada. A licao ficou registrada em `docs/WORKFLOW.md`: todo requisito com
secao de design tem esse doc, e ele - junto dos links do Figma nele referenciados
- precisa ser consultado **antes** de implementar, nao depois.

## Objetivo

Criar a superficie de documentacao - navegacao, layout de leitura e blocos de
codigo - pronta para receber conteudo, sem quebrar a promessa de interface unica
de RF09.

## Escopo tecnico

- `apps/web/src/features/docs/` (novo) - pagina, indice, busca
- `apps/web/src/features/docs/content/` (novo) - modulos de conteudo
- `apps/web/src/features/workspace/components/open-example-dialog.tsx` (novo)
- `apps/web/src/features/workspace/hooks/use-project-link.ts` - `overrideSources`
- `apps/web/src/App.tsx` - terceira `view` ('docs'), orquestra o "Onde abrir"

## Passo a passo (como foi feito, apos consultar o Figma)

1. **Acesso**: pagina propria (`DocsPage`), nao dialogo/painel - `App.tsx` ganha
   uma terceira `View` ('workspace' | 'projects' | 'docs'), no mesmo padrao
   ja usado por 'projects' (troca de tela desmonta a anterior; nenhum roteador
   de URL, RF07-I02 ja provou que isso funciona sem um). Botao "Documentacao"
   no cabecalho do workspace e de "Meus projetos", cada um so navegando - sem
   estado de "aberto/fechado" proprio.
2. Componentes TSX por secao em `content/`, evitando pipeline de Markdown para
   poucas paginas.
3. Estrutura de dados de cada secao: `id`, `category` ('inicio-rapido' |
   'referencia' | 'ajuda' - os tres grupos do indice no Figma), `titulo`,
   `resumo`, `componente` - fonte unica do indice, da busca e da navegacao
   Anterior/Proximo (por ordem de declaracao em `content/index.ts`).
4. Layout de tres regioes: indice agrupado por categoria a esquerda, coluna de
   leitura central (`max-w-[72ch]`, conforme a anotacao do Figma 1.3), rodape
   com Anterior/Proximo. A mini-tabela de conteudo lateral do Figma ("NESTA
   PAGINA") ficou de fora - so faz sentido com secoes longas o bastante para
   ter subtitulos proprios, que ainda nao existem (RF11-I02/I03).
5. Busca simples por titulo e resumo, sem indexador.
6. `CodeBlock`: sem realce de sintaxe (ver Riscos), com duas acoes na ordem e
   hierarquia do Figma 7.6 - "Copiar" primeiro, contorno; "Abrir no editor"
   depois, preenchido (`variant="default"`, laranja) porque e a acao que a
   documentacao quer estimular.
7. "Abrir no editor" com projeto aberto: dialogo "Onde abrir" (Figma 7.6, texto
   e comportamento replicados a risca) - "Abrir em um projeto novo" (marcado
   por padrao, nao mexe no projeto atual) ou "Substituir o conteudo atual"
   (mantem o projeto aberto, troca as fontes ao vivo, nunca pre-selecionada).
   Isso e **independente** do dialogo "Sair sem salvar?" de RF07-I03: um e
   sobre "ha projeto aberto" (Figma), o outro e sobre "ha alteracao nao salva"
   (RF07-I03) - os dois compoem quando fazem sentido (ex.: substituir o
   conteudo de um projeto e so depois tentar sair sem salvar).
8. Busca sem resultado (Figma 7.6): quando o termo bate com uma tabela pequena
   e deliberadamente curta de construcoes fora de escopo (`always_ff`,
   `always_comb`, `logic`, ...), aponta o equivalente em Verilog e sugere a
   secao "O que o TP Lab nao faz" - em vez de um "nada encontrado" generico.
9. Acessibilidade: `h1` dinamico = titulo da secao ativa, `h2`+ para
   subtitulos sem pular nivel, indice como `<nav>` semantica. Sem painel/Sheet,
   nao ha foco preso nem retorno de foco para tratar - e uma pagina normal.

## Criterios de aceite

- [x] A documentacao e alcancavel de qualquer ponto da aplicacao (pagina
      propria, nao sobreposta) e voltar ao editor nao descarta o codigo em
      edicao (rascunho local de RF07-I03 cobre o intervalo).
- [x] O indice lista as secoes agrupadas por categoria e destaca a ativa.
- [x] A busca filtra por titulo e resumo; termo fora de escopo sugere o
      equivalente em Verilog e a pagina de limites.
- [x] Blocos de codigo copiam para a area de transferencia com confirmacao.
- [x] "Abrir no editor" pergunta "Onde abrir" quando ha projeto aberto (novo
      projeto vs. substituir o atual) e carrega direto quando nao ha.
- [x] A hierarquia de titulos e correta e navegavel por leitor de tela.
- [x] O conteudo e legivel nos dois temas (conferido em claro e escuro).
- [x] Nenhuma dependencia nova alem do componente shadcn/ui usado
      (`git diff package.json`/`pnpm-lock.yaml` vazio).

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web test
pnpm --filter @tplab/web build
```

Manual (via `chrome-devtools`, com screenshots comparados aos frames do Figma
7.1/7.3/7.6): navegar entre secoes e Anterior/Proximo; buscar `always_ff` e
conferir a sugestao; abrir um exemplo sem projeto aberto (carrega direto), com
projeto aberto e limpo (dialogo "Onde abrir", as duas opcoes), e com projeto
aberto e alterado (os dois dialogos compoem); claro e escuro.

## Riscos

- Reaproveitar o Monaco para realce nos blocos de codigo pode carregar mais
  instancias do que o necessario; medido descartado por ora - `<pre>`
  monoespacado simples, sem dependencia nova.
- A tabela de termos fora de escopo e deliberadamente pequena; crescer sem
  criterio vira um LRM ruim (mesmo risco ja registrado em RF11-I03).

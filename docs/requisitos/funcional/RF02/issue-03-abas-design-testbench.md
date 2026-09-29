# RF02-I03 - Abas de arquivo com preservacao de estado por arquivo

| Campo | Valor |
| --- | --- |
| Feature | [RF02](feature.md) |
| Branch | `feat-RF02-destaque-tema-abas-front` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF02-I02 |

## Contexto

`workspace.tsx` mantem `activeTab: 'design' | 'testbench'` e troca o conteudo
passado ao editor. Trocar o texto de um unico modelo do Monaco descarta historico
de undo, posicao de cursor e scroll: o usuario volta para o arquivo e perde o
lugar onde estava. RF05 tambem precisa dessa navegacao, porque um diagnostico
aponta arquivo *e* linha.

## Objetivo

Manter um modelo do Monaco por arquivo, preservando undo, cursor e scroll ao
alternar, e expor uma API de navegacao usavel por RF05.

## Escopo tecnico

- `apps/web/src/features/workspace/code-editor.tsx`
- `apps/web/src/features/workspace/workspace.tsx`
- Componente novo de abas, baseado em shadcn/ui

## Passo a passo

1. Criar um `monaco.editor.ITextModel` por arquivo, com URI derivada do nome
   (`file:///design.v`, `file:///tb.v`) e linguagem `verilog`.
2. Ao trocar de aba, usar `editor.setModel(...)` em vez de substituir o valor, e
   restaurar `ViewState` salvo (`editor.saveViewState()` / `restoreViewState()`).
3. Propagar alteracoes para o estado `sources` do `Workspace` mantendo o formato
   de `HdlSourcesSchema`.
4. Renomear um arquivo deve recriar o modelo com a nova URI sem perder conteudo.
5. Expor uma funcao imperativa `revealPosition(file, line, column)` para RF05
   usar, via `useImperativeHandle` ou callback registrada.
6. Garantir navegacao por teclado entre as abas (setas, `Home`/`End`) e `role`
   ARIA adequado.

## Criterios de aceite

- [x] Alternar abas preserva conteudo, posicao do cursor, selecao e scroll.
      _(verificado ao vivo para cursor - ver Nota; selecao e scroll usam a
      mesma API (`saveViewState`/`restoreViewState`), confirmada por leitura
      do codigo-fonte de `@monaco-editor/react`)_
- [x] `Ctrl+Z` desfaz apenas no arquivo correspondente, sem misturar historicos.
      _(consequencia estrutural de um `ITextModel` por arquivo, que ja estava
      confirmado - o historico de undo pertence ao modelo, nao ao editor; nao
      testado digitando e desfazendo ao vivo nesta sessao)_
- [x] Chamar `revealPosition('tb.v', 12, 5)` troca para a aba certa e posiciona o
      cursor na linha e coluna informadas. _(ja existia, construido para
      RF05-I02 e verificado ao vivo em sessao anterior)_
- [x] As abas sao operaveis so pelo teclado, com foco visivel. _(ja existia,
      `FileTabs` - RF09-I03 - implementa `role="tablist"`/`tabIndex` em
      roving, setas/Home/End e `focus-visible:ring`)_
- [x] Nao ha vazamento de modelos: modelos sao descartados ao desmontar.
      _(era falso antes desta issue - ver Nota de implementacao)_

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: digitar nos dois arquivos, alternar varias vezes, desfazer, redimensionar.

## Nota de implementacao

Boa parte do escopo tecnico desta issue (passos 1-3 e 5) ja estava pronta
antes dela ser aberta: `@monaco-editor/react` (ja em uso) cria e cacheia um
`monaco.editor.ITextModel` por `path` (aqui, o nome do arquivo) e chama
`editor.setModel(...)` + `saveViewState()`/`restoreViewState()` sozinho a cada
troca do prop `path` - conferido lendo o codigo-fonte da biblioteca
(`node_modules/.../@monaco-editor/react/dist/index.js`) e depois ao vivo:
abri `full_adder.v`, fui ate o fim (Ln 11), troquei para a aba do testbench,
posicionei o cursor em Ln 4, voltei para `full_adder.v` - cursor continuava em
Ln 11; fui para o testbench de novo - continuava em Ln 4. `revealPosition`
(passo 5) tambem ja existia, construida para RF05-I02. Passo 6 (navegacao por
teclado nas abas) tambem ja existia, em `FileTabs` (RF09-I03).

O unico item genuinamente em aberto era o risco que a propria issue ja
citava: **"modelos do Monaco nao sao coletados automaticamente".** Investigando
o codigo-fonte de `@monaco-editor/react` (a opcao `keepCurrentModel`, padrao
`false`) achei que, ao desmontar o `<Editor>`, a biblioteca descarta *so o
modelo ativo no momento* (`n.current.getModel()?.dispose()`) - o modelo da
aba **inativa** (visitada antes, mas nao selecionada no momento do desmonte)
fica no registro global do Monaco (`monaco.editor.getModels()`) para sempre,
ate a pagina recarregar. Como `Workspace` remonta `CodeEditor` inteiro por
`key={project.id}` (`App.tsx`) a cada troca de projeto, e o nome de arquivo
vem do nome do projeto (`project-sources.ts`), isso e ao mesmo tempo (a) um
vazamento de memoria puro em sessoes longas com varias trocas de projeto e
(b) um risco de conteudo desatualizado se dois projetos diferentes
acabarem com o mesmo nome de arquivo (nomes de projeto nao sao garantidos
unicos) - o modelo antigo, com o path colidindo, seria reaproveitado com o
conteudo de outro projeto em vez do `value` atual.

Corrigido em `code-editor.tsx`: `visitedFileNamesRef` acumula todo `fileName`
visitado durante a vida do componente; um `useEffect` com cleanup e `[]}` de
dependencia (roda so no desmonte final) percorre esse conjunto e chama
`monaco.editor.getModel(monaco.Uri.parse(name))?.dispose()` para cada um -
`getModel` devolve `undefined` para o que a propria biblioteca ja descartou
(o ativo), entao nao ha risco de "dispose" duplicado nem depende da ordem de
limpeza entre o `<Editor>` (filho) e este efeito (no componente pai).

Verificado ao vivo (chrome-devtools MCP): abri um segundo projeto salvo
(`meu_projeto`, nomes de arquivo diferentes de `full_adder`), visitei as duas
abas (design e testbench, criando dois modelos), voltei para "Meus projetos"
(desmontando `CodeEditor` por completo) e reabri o projeto anonimo original -
sem nenhum erro no console em nenhuma das trocas. Nao foi possivel medir
diretamente o numero de modelos vivos no registro do Monaco (nao exposto
globalmente pelo bundle local, por design de RF02-I01/RNF01 - carregamento
sem CDN); a verificacao ficou no nivel de "nao lanca excecao ao descartar" e
na leitura do codigo-fonte que prova o que exatamente e descartado.

## Riscos

- Modelos do Monaco nao sao coletados automaticamente; esquecer o `dispose()`
  causa vazamento de memoria em sessoes longas. _(era exatamente esse o gap -
  ver Nota de implementacao)_

# RF02-I03 - Abas de arquivo com preservacao de estado por arquivo

| Campo | Valor |
| --- | --- |
| Feature | [RF02](feature.md) |
| Branch | `feat/rf02-abas-design-testbench` |
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

- [ ] Alternar abas preserva conteudo, posicao do cursor, selecao e scroll.
- [ ] `Ctrl+Z` desfaz apenas no arquivo correspondente, sem misturar historicos.
- [ ] Chamar `revealPosition('tb.v', 12, 5)` troca para a aba certa e posiciona o
      cursor na linha e coluna informadas.
- [ ] As abas sao operaveis so pelo teclado, com foco visivel.
- [ ] Nao ha vazamento de modelos: modelos sao descartados ao desmontar.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: digitar nos dois arquivos, alternar varias vezes, desfazer, redimensionar.

## Riscos

- Modelos do Monaco nao sao coletados automaticamente; esquecer o `dispose()`
  causa vazamento de memoria em sessoes longas.

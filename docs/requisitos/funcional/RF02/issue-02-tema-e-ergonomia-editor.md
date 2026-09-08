# RF02-I02 - Tema sincronizado e opcoes de ergonomia do editor

| Campo | Valor |
| --- | --- |
| Feature | [RF02](feature.md) |
| Branch | `feat/rf02-tema-e-ergonomia-editor` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | RF02-I01 |

## Contexto

O tema claro/escuro da aplicacao vive em `apps/web/src/components/theme-provider.tsx`
e `hooks/use-theme.ts`. O Monaco tem tema proprio: se os dois nao forem
sincronizados, o usuario acaba com editor claro dentro de interface escura, o que
alem de feio quebra o contraste exigido por RNF09.

## Objetivo

Amarrar o tema do editor ao tema global e fixar as opcoes de ergonomia do Monaco
em um unico lugar.

## Escopo tecnico

- `apps/web/src/features/workspace/code-editor.tsx`
- `apps/web/src/lib/monaco.ts` (definicao dos temas, se necessario)
- `apps/web/src/hooks/use-theme.ts` (apenas consumo)

## Passo a passo

1. Consumir o tema atual via `useTheme` e mapear para o tema do Monaco
   (`vs` / `vs-dark`), reagindo tambem a mudanca de preferencia do sistema quando
   o modo for "system".
2. Centralizar as opcoes do editor em uma constante unica: `lineNumbers: 'on'`,
   `tabSize: 2`, `insertSpaces: true`, `minimap: { enabled: false }`,
   `wordWrap: 'on'`, `scrollBeyondLastLine: false`, `automaticLayout: true`,
   `fontSize` legivel, `renderWhitespace: 'selection'`, `bracketPairColorization`
   habilitado.
3. Verificar o contraste dos tokens de sintaxe nos dois temas; se algum par
   ficar abaixo de AA, definir tema customizado com `monaco.editor.defineTheme`.
4. Conferir que o editor redimensiona corretamente ao arrastar os
   `react-resizable-panels`.

## Criterios de aceite

- [ ] Alternar o tema pelo `ThemeToggle` muda o editor imediatamente, sem
      recarregar a pagina.
- [ ] Com o modo "system", mudar a preferencia do sistema operacional atualiza o
      editor.
- [ ] Minimap desativado, numeracao ativa, indentacao de 2 espacos.
- [ ] Arrastar os divisores de painel nao deixa o editor com area errada.
- [ ] Contraste de texto do editor em AA nos dois temas.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Verificacao de contraste com a skill `a11y-audit` ou ferramenta equivalente.

## Riscos

- `automaticLayout` tem custo de observacao de resize; se houver perda de
  desempenho perceptivel, trocar por `ResizeObserver` explicito nos paineis.

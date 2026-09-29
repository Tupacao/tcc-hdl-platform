# RF02-I02 - Tema sincronizado e opcoes de ergonomia do editor

| Campo | Valor |
| --- | --- |
| Feature | [RF02](feature.md) |
| Branch | `feat-RF02-destaque-tema-abas-front` |
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

- [x] Alternar o tema pelo `ThemeToggle` muda o editor imediatamente, sem
      recarregar a pagina. _(verificado ao vivo)_
- [x] Com o modo "system", mudar a preferencia do sistema operacional atualiza o
      editor. _(`ThemeProvider` ja escuta `matchMedia('(prefers-color-scheme:
      dark)')` e resolve em `resolvedTheme`, que o editor consome - sem
      codigo novo aqui; nao testado trocando a preferencia real do SO nesta
      sessao)_
- [x] Minimap desativado, numeracao ativa, indentacao de 2 espacos.
- [x] Arrastar os divisores de painel nao deixa o editor com area errada.
      _(`automaticLayout: true`, ja presente antes desta issue, inalterado)_
- [x] Contraste de texto do editor em AA nos dois temas. _(os tokens `--code-*`
      ja tinham contraste AA calculado para RF11/RNF09; o tema Monaco novo so
      reaproveita esses valores, nao introduz cor nova)_

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Verificacao de contraste com a skill `a11y-audit` ou ferramenta equivalente.

## Nota de implementacao

`docs/design-system-fundamentos.md` secao 8 ja deixava registrado que os
temas `vs`/`vs-dark` padrao do Monaco nao foram construidos sobre a paleta do
produto e que as quatro ultimas linhas da tabela (fundo do editor, numero de
linha, linha atual, selecao) eram "pendentes... RF02, fora do escopo" de uma
correcao anterior (RF11). Essa issue fecha essa pendencia:

- **`apps/web/src/index.css`**: cinco tokens novos, `--editor-background`,
  `--editor-line-number`, `--editor-current-line`, `--editor-selection` e
  `--editor-error-line` (este ultimo nao estava na tabela original do Monaco
  em si, mas a linha "Linha com erro" da secao 8 pedia um fundo para isso -
  ver abaixo), com os valores exatos da tabela da secao 8, nos dois temas.
- **`apps/web/src/lib/monaco-theme.ts`** (novo): `applyEditorTheme(monaco,
  isDark)` le esses tokens e os `--code-*` (ja existentes, de RF11) via
  `getComputedStyle(document.documentElement)` - mesmo padrao de
  `readWaveformColors` (RF06) - e monta um `monaco.editor.defineTheme`
  (`base: vs`/`vs-dark`, `inherit: true`) mapeando os *token names* que o
  tokenizer `systemverilog` realmente emite (`keyword.wire`, `keyword.sv`
  para diretivas genericas via `tokenPostfix: '.sv'`, `variable.predefined`
  para `$display` etc., `number`, `string`, `comment`, `delimiter`) para essas
  cores. Chamado em `beforeMount` (evita o flash do tema `vs` padrao antes do
  editor nascer) e de novo num `useEffect` a cada troca de `resolvedTheme`.
- **`code-editor.tsx`**: opcoes centralizadas conforme o passo 2
  (`lineNumbers: 'on'`, `tabSize: 2`, `insertSpaces: true`, `wordWrap: 'on'`,
  `renderWhitespace: 'selection'`, `renderLineHighlight: 'all'` - trocado de
  `'gutter'`, que nao mostrava a linha atual pedida pela secao 8).

**Achado nao previsto no passo a passo**: `bracketPairColorization` (pedido
habilitado no passo 2) recolore `module`/`endmodule`, `begin`/`end` etc. por
profundidade de aninhamento, por cima da paleta fixa por categoria da secao
8 - e como esses pares costumam envolver o arquivo/bloco inteiro em Verilog,
o efeito e quase permanente, nao ocasional. Verificado ao vivo (inspecionando
as classes CSS que o Monaco aplica aos tokens) e desligado deliberadamente;
`matchBrackets` (padrao do Monaco) continua destacando o par correspondente
ao cursor, entao a intencao de I01 ("begin/end reconhecidos como par para
destaque") nao se perde, so a recolorizacao permanente do texto.

**Segundo achado**: `bracketPairColorization`/`tabSize`/`insertSpaces` sao, na
verdade, propriedades do **modelo** Monaco (`ITextModel.updateOptions`), nao
so do editor - passa-las em `options` no `<Editor>` nao alcanca de forma
confiavel um modelo criado fora de `editor.create()`, que e exatamente o caso
aqui (`@monaco-editor/react` cria/cacheia um modelo por `path` para a
preservacao de estado entre abas de I03). Sem repassar isso para o modelo via
`applyModelOptions` (nova funcao em `code-editor.tsx`, chamada na montagem e a
cada troca de aba), a colorizacao "arco-iris" continuava aparecendo mesmo com
a opcao desligada no editor - confirmado ao vivo, revertido depois do fix.

Verificado ao vivo (chrome-devtools MCP) nos dois temas: alternancia de tema
instantanea sem reload, cores corretas (ver Nota de I01), linha atual com
fundo (`#F1F1F4`/`#17171E`), e uma simulacao completa `Executar` -> sucesso
(0 erros, waveform renderizada) sem nenhum erro no console, confirmando que as
mudancas de opcao do editor nao regrediram o pipeline RF03/RF04.

## Riscos

- `automaticLayout` tem custo de observacao de resize; se houver perda de
  desempenho perceptivel, trocar por `ResizeObserver` explicito nos paineis.
  _(nao alterado nesta issue, sem sinal de problema)_
- JetBrains Mono 13px/altura de linha 22px (Figma "1.3 Tipografia") ficou fora
  do escopo: exigiria carregar uma fonte web nova (nenhuma fonte customizada e
  carregada hoje, nem para o resto da interface), decisao maior que uma issue
  P. `fontSize: 14` (legivel, default do Monaco) mantido; revisitar junto de
  uma tarefa de tipografia do design system, se houver.

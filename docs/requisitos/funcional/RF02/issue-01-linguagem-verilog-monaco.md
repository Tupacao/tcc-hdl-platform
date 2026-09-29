# RF02-I01 - Validar e ajustar a definicao de linguagem Verilog no Monaco

| Campo | Valor |
| --- | --- |
| Feature | [RF02](feature.md) |
| Branch | `feat-RF02-destaque-tema-abas-front` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

`apps/web/src/lib/monaco.ts` importa apenas a contribuicao `systemverilog` das
basic-languages do Monaco, que registra os ids `verilog` e `systemverilog`. Essa
definicao nunca foi verificada contra o Verilog que os usuarios vao escrever de
fato, em especial construcoes de testbench.

## Objetivo

Garantir que o destaque de sintaxe cobre as construcoes usadas no material
didatico do TCC e, se houver lacuna, complementar a definicao sem trocar de
biblioteca.

## Escopo tecnico

- `apps/web/src/lib/monaco.ts`
- `apps/web/src/lib/samples.ts` (arquivos de referencia para o teste visual)

## Passo a passo

1. Montar um arquivo de checagem cobrindo: `module`/`endmodule`, portas
   (`input`, `output`, `inout`, `wire`, `reg`), parametros, `always @(posedge
   clk)`, `initial`, blocos `begin`/`end`, `case`/`endcase`, atribuicoes `<=` e
   `=`, literais com base (`4'b1010`, `8'hFF`, `16'd255`), delays (`#10`),
   diretivas (`` `timescale ``, `` `define ``), tarefas de sistema (`$display`,
   `$monitor`, `$dumpfile`, `$dumpvars`, `$finish`) e comentarios `//` e `/* */`.
2. Abrir esse arquivo no editor e conferir cada categoria visualmente nos dois
   temas.
3. Onde a tokenizacao falhar, registrar a ocorrencia e corrigir via
   `monaco.languages.setMonarchTokensProvider` complementar ou
   `setLanguageConfiguration` (pares, comentarios, `folding`), sem substituir a
   contribuicao existente.
4. Definir explicitamente a configuracao de linguagem: `comments` (`//` e
   `/* */`), `brackets`, `autoClosingPairs`, `surroundingPairs` e
   `indentationRules` para `begin`/`end`.
5. Confirmar no DevTools (aba Network) que nenhuma requisicao vai para CDN.

## Criterios de aceite

- [x] Todas as categorias do arquivo de checagem aparecem coloridas e
      distinguiveis nos temas claro e escuro. _(verificado ao vivo, ver Nota
      de implementacao)_
- [~] `Ctrl+/` comenta e descomenta linha; comentario de bloco funciona.
      _(configuracao presente e correta - ver Nota; tecla em si nao pode ser
      confirmada com este navegador automatizado, ver Riscos/limitacoes)_
- [x] Digitar `(`, `[` ou `"` fecha o par automaticamente. _(`autoClosingPairs`
      do Monaco, ja presente na contribuicao `systemverilog`)_
- [x] `begin` e `end` sao reconhecidos como par para destaque e dobra de codigo.
      _(`conf.brackets` e `conf.folding.markers`, ja presentes)_
- [x] Nenhuma requisicao externa ao abrir o editor. _(verificado ao vivo, aba
      Network do DevTools: zero requisicoes fora de `localhost`)_
- [x] `pnpm typecheck` e `pnpm --filter @tplab/web build` passam.

## Verificacao

Manual, com o arquivo de checagem, mais:

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

## Nota de implementacao

A contribuicao `systemverilog` que `apps/web/src/lib/monaco.ts` ja importava
(`monaco-editor/esm/vs/basic-languages/systemverilog/systemverilog.contribution.js`)
ja cobre, sem nenhum codigo novo, praticamente tudo que o passo 1 pedia:
`comments` (`//` e `/* */`), `brackets` com `begin`/`end`,
`module`/`endmodule`, `case`/`endcase` etc., `autoClosingPairs` para
`(`/`[`/`{`/`'`/`"`, `folding.markers` para os mesmos pares, uma lista extensa
de palavras-chave Verilog/SystemVerilog, tokenizacao de literais com base
(`4'b1010`, `8'hFF`, `16'd255` - regras dedicadas para `'b`/`'h`/`'o`/`'d`),
tarefas de sistema (`$display` etc., via `[$][a-zA-Z0-9_]+` -> token
`variable.predefined`) e diretivas de pre-processador
(`` `timescale ``/`` `define `` -> token `keyword`; `` `include `` tem estado
dedicado). Passo 4 (definir `comments`/`brackets`/`autoClosingPairs`/
`surroundingPairs`/`indentationRules` explicitamente) tambem ja estava feito,
so que dentro da contribuicao do proprio Monaco em vez de em
`setLanguageConfiguration` custom - a issue foi escrita antes de checar o
codigo-fonte da contribuicao, entao presumia uma lacuna maior do que a real.

O gap real, fechado em RF02-I02, nao era de tokenizacao: era de **tema**. Os
temas padrao `vs`/`vs-dark` nao usam a paleta do produto - `module`/`always`
saiam azuis (cor padrao de "keyword" do VS Code), nao laranja
(`--code-keyword`). Isso so apareceu ao efetivamente abrir o editor e olhar,
confirmando por que o passo 2 desta issue ("abrir o arquivo e conferir
visualmente") era necessario mesmo com a tokenizacao correta - destaque de
sintaxe sem o tema certo por cima continua "errado" aos olhos do usuario.

Verificado ao vivo (chrome-devtools MCP, `localhost:5173`) com os dois
arquivos reais do projeto de exemplo (`full_adder.v`/`full_adder_tb.v`), nos
dois temas, apos o tema customizado de I02 entrar: `` `timescale ``/`` `define ``
roxo, `module`/`assign`/`always`/`begin`/`end`/`initial` laranja, `wire`/`reg`/
`input`/`output`/`integer` laranja mais escuro (categoria "tipo", distinta de
"palavra-chave"), `$dumpfile`/`$dumpvars`/`$display`/`$finish` roxo (mesma cor
de diretiva - o Monaco tokeniza tarefa de sistema e diretiva de forma
parecida, e o design tambem as agrupa numa cor so), literais e numeros em
azul, strings em verde, comentarios em cinza. Confirmado tambem via inspecao
das regras CSS que o Monaco gera (`.mtk*`) que os valores batem exatamente com
os tokens `--code-*` de `docs/design-system-fundamentos.md` secao 8.

`Ctrl+/` (comentar linha) nao pode ser confirmado por este caminho: nem
`chrome-devtools.press_key("Control+/")` nem um `KeyboardEvent` sintetico
despachado diretamente no `<textarea>` do Monaco (com foco confirmado)
alteraram o texto - e `F1` (paleta de comandos, tambem padrao do Monaco) nao
abriu nenhum widget visivel por nenhum dos dois caminhos. Como nenhum codigo
deste projeto sobrescreve ou intercepta esse atalho (`shortcuts.ts` registra
`comment` como `scope: 'editor'` e o listener global de
`workspace.tsx` explicitamente pula atalhos desse escopo, deixando o Monaco
cuidar sozinho - comentario documentado no proprio codigo), e a acao
`editor.action.commentLine` e um padrao nativo e amplamente testado do
Monaco/VS Code que depende so de `conf.comments` (presente e correto), a
leitura mais provavel e uma limitacao do teclado sintetico do navegador
automatizado (o servico de keybinding do Monaco e conhecido por exigir a
forma exata do evento nativo do SO) - nao um defeito da aplicacao. Registrado
como inconclusivo em vez de marcado como testado; recomenda-se uma conferencia
manual num teclado real antes de fechar essa duvida por completo.

## Riscos

- Sobrescrever a definicao das basic-languages por engano quebra tambem o
  `systemverilog`. Complementar, nao substituir. _(nao se aplicou - nada foi
  sobrescrito, so o tema por cima)_
- Aumento do bundle: qualquer import novo do Monaco deve ser conferido no
  relatorio de build. _(nao se aplicou - nenhum import novo do Monaco)_

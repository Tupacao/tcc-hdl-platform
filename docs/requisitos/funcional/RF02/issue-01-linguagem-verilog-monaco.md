# RF02-I01 - Validar e ajustar a definicao de linguagem Verilog no Monaco

| Campo | Valor |
| --- | --- |
| Feature | [RF02](feature.md) |
| Branch | `feat/rf02-linguagem-verilog-monaco` |
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

- [ ] Todas as categorias do arquivo de checagem aparecem coloridas e
      distinguiveis nos temas claro e escuro.
- [ ] `Ctrl+/` comenta e descomenta linha; comentario de bloco funciona.
- [ ] Digitar `(`, `[` ou `"` fecha o par automaticamente.
- [ ] `begin` e `end` sao reconhecidos como par para destaque e dobra de codigo.
- [ ] Nenhuma requisicao externa ao abrir o editor.
- [ ] `pnpm typecheck` e `pnpm --filter @tplab/web build` passam.

## Verificacao

Manual, com o arquivo de checagem, mais:

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

## Riscos

- Sobrescrever a definicao das basic-languages por engano quebra tambem o
  `systemverilog`. Complementar, nao substituir.
- Aumento do bundle: qualquer import novo do Monaco deve ser conferido no
  relatorio de build.

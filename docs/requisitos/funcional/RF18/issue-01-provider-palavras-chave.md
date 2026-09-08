# RF18-I01 - Provider de autocompletar com palavras-chave e tarefas de sistema

| Campo | Valor |
| --- | --- |
| Feature | [RF18](feature.md) |
| Branch | `feat/rf18-provider-palavras-chave` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF02-I01 |

## Contexto

As basic-languages do Monaco fornecem tokenizacao e coloracao para `verilog`, mas
nao um `CompletionItemProvider`. O que o usuario ve hoje, se ver alguma coisa, e
a sugestao generica por palavras do documento - que oferece qualquer texto ja
digitado, inclusive erros de digitacao.

`apps/web/src/lib/monaco.ts` ja centraliza a configuracao do Monaco e exporta
`VERILOG_LANGUAGE_ID`, o que da o ponto natural de registro.

## Objetivo

Registrar um provider que ofereca as palavras-chave da linguagem e as tarefas de
sistema, com descricao em portugues.

## Escopo tecnico

- `apps/web/src/lib/verilog-completions.ts` (novo) - catalogo
- `apps/web/src/lib/monaco.ts` - registro do provider
- `apps/web/src/features/workspace/code-editor.tsx` - se o registro depender da
  instancia

## Passo a passo

1. Montar o catalogo, cada entrada com rotulo, tipo, texto inserido e descricao
   curta em portugues:
   - **estrutura**: `module`, `endmodule`, `input`, `output`, `inout`, `wire`,
     `reg`, `parameter`, `localparam`, `assign`, `integer`, `genvar`;
   - **fluxo**: `always`, `initial`, `begin`, `end`, `if`, `else`, `case`,
     `endcase`, `default`, `for`, `while`, `repeat`, `forever`;
   - **eventos**: `posedge`, `negedge`, `or`;
   - **primitivas**: `and`, `or`, `not`, `nand`, `nor`, `xor`, `xnor`, `buf`;
   - **tarefas de sistema**: `$display`, `$write`, `$monitor`, `$time`,
     `$dumpfile`, `$dumpvars`, `$finish`, `$stop`, `$random`, `$fatal`;
   - **diretivas**: `` `define ``, `` `include ``, `` `timescale ``, `` `ifdef ``.
2. Registrar o provider uma unica vez, junto da configuracao do Monaco, para a
   linguagem `verilog`. Registrar dentro de um efeito de componente duplicaria as
   sugestoes a cada montagem.
3. Definir os caracteres de disparo: `$` para tarefas de sistema e `` ` `` para
   diretivas, alem do disparo normal por digitacao.
4. Classificar cada item com o `CompletionItemKind` adequado, para o Monaco
   mostrar o icone certo, e preencher `documentation` com a descricao.
5. Suprimir sugestoes dentro de comentario e de string, consultando o token na
   posicao do cursor.
6. Escrever as descricoes reaproveitando os textos de RF11-I03, para nao haver
   duas explicacoes divergentes do mesmo elemento.
7. Verificar que o provider nao interfere na deteccao de erros de RF05 nem nos
   marcadores.
8. Confirmar que nada disso adiciona dependencia ao `package.json`.

## Criterios de aceite

- [ ] Digitar `mod` sugere `module` com descricao.
- [ ] Digitar `$` lista as tarefas de sistema.
- [ ] Digitar `` ` `` lista as diretivas.
- [ ] Cada item tem icone coerente e descricao em portugues.
- [ ] Nao ha sugestao dentro de comentario ou string.
- [ ] Trocar de aba nao duplica as sugestoes.
- [ ] Nenhuma dependencia nova foi adicionada.
- [ ] As descricoes coincidem com a referencia de RF11.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: digitar cada categoria de disparo e conferir a lista; alternar abas
varias vezes e confirmar que nao ha duplicacao.

## Riscos

- Registrar o provider dentro de `useEffect` sem descarte acumula registros e
  duplica sugestoes; registrar no modulo, uma vez.
- Catalogo grande demais atrapalha: sugerir toda palavra reservada, inclusive as
  que o publico-alvo nunca usa, esconde as uteis. Manter o catalogo enxuto e
  alinhado com RF11-I03.

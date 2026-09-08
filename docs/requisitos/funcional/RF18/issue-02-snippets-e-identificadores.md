# RF18-I02 - Snippets e identificadores do arquivo

| Campo | Valor |
| --- | --- |
| Feature | [RF18](feature.md) |
| Branch | `feat/rf18-snippets-e-identificadores` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF18-I01 |

## Contexto

Palavras-chave isoladas ajudam pouco quem nao conhece a estrutura da linguagem.
Sugerir `module` nao ensina que ele precisa de lista de portas, `;` e
`endmodule`. Snippets entregam a estrutura inteira, com os pontos a preencher
marcados - e o formato que mais ensina.

A segunda metade da issue e complementar: sugerir os identificadores ja
declarados no arquivo (nomes de modulo, portas, sinais). E o que evita o erro de
digitacao em nome de sinal, uma das causas mais frequentes de erro de
elaboracao.

## Objetivo

Acrescentar snippets das construcoes usuais e sugestao dos identificadores
declarados no arquivo atual.

## Escopo tecnico

- `apps/web/src/lib/verilog-snippets.ts` (novo)
- `apps/web/src/lib/verilog-identifiers.ts` (novo) - extracao textual
- `apps/web/src/lib/verilog-completions.ts` - integracao

## Passo a passo

1. Escrever os snippets com a sintaxe de pontos de parada do Monaco
   (`${1:nome}`), cobrindo:
   - `module` completo com portas e `endmodule`;
   - `always @(posedge clk)` com `begin`/`end`;
   - `always @(*)` combinacional;
   - `initial` de testbench com `$dumpfile`, `$dumpvars` e `$finish`;
   - geracao de clock (`always #5 clk = ~clk;`);
   - `case` com `default`;
   - `if`/`else` com blocos.
2. Formatar os snippets no mesmo estilo dos exemplos de
   `apps/web/src/lib/samples.ts` - indentacao de 4 espacos, mesma convencao de
   nomes -, para que o codigo inserido pareca com o que o aluno ja viu.
3. Ordenar os pontos de parada na sequencia em que fazem sentido preencher, e
   terminar dentro do corpo do bloco.
4. Extrair identificadores do texto do modelo por expressao regular: nomes apos
   `module`, `input`, `output`, `inout`, `wire`, `reg`, `parameter`. Analise
   textual, sem parser - assumido e documentado como heuristica.
5. Recalcular a lista com debounce, e nao a cada tecla; excluir a palavra que
   esta sendo digitada para nao sugerir o proprio prefixo incompleto.
6. Ordenar as sugestoes por relevancia com `sortText`: identificadores do
   arquivo primeiro, depois palavras-chave, depois snippets. Quem digita um nome
   de sinal quer o sinal, nao uma estrutura.
7. Distinguir visualmente as categorias pelo `CompletionItemKind`.
8. Verificar o custo com um arquivo grande (proximo de `MAX_SOURCE_BYTES`, 256
   KB), garantindo que a extracao nao trave a digitacao.

## Criterios de aceite

- [ ] O snippet de `module` insere a estrutura completa com pontos de parada.
- [ ] O snippet de testbench inclui `$dumpfile`, `$dumpvars` e `$finish`.
- [ ] Sinais declarados no arquivo aparecem entre as sugestoes.
- [ ] Identificadores tem prioridade sobre palavras-chave e snippets.
- [ ] As categorias sao visualmente distinguiveis.
- [ ] Em arquivo grande a digitacao continua fluida.
- [ ] Os snippets seguem o estilo de `samples.ts`.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: inserir cada snippet e percorrer os pontos de parada com `Tab`; declarar
um sinal e conferir que ele aparece; testar com arquivo grande.

## Riscos

- Extracao por regex pega falso positivo dentro de comentario ou string; o custo
  e uma sugestao inutil, aceitavel para o ganho - mas precisa estar documentado
  no codigo.
- Recalcular a cada tecla em arquivo grande trava a digitacao; debounce e
  requisito.

# RF13-I02 - Emissor de Verilog legivel

| Campo | Valor |
| --- | --- |
| Feature | [RF13](feature.md) |
| Branch | `feat/rf13-emissor-verilog` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF13-I01 |

## Contexto

Com a representacao intermediaria pronta, falta transformar em texto. O criterio
aqui nao e apenas "compila": o codigo gerado e material de estudo. Um aluno vai
compara-lo com o desenho para entender a correspondencia, e depois vai copiar
esse estilo quando escrever sozinho. Codigo gerado feio ensina a escrever feio.

O alvo e Verilog-2001 aceito por `iverilog -g2012`, no estilo dos exemplos ja
existentes em `apps/web/src/lib/samples.ts` - portas com `input wire` /
`output wire` declaradas no cabecalho, indentacao de 4 espacos, comentario em
portugues sem acentuacao.

## Objetivo

Emitir Verilog correto, formatado e legivel a partir da representacao
intermediaria.

## Escopo tecnico

- `apps/web/src/features/circuit/codegen/emit.ts` (novo)
- `apps/web/src/features/circuit/codegen/emit.test.ts` (novo)
- `apps/web/src/lib/samples.ts` - referencia de estilo

## Passo a passo

1. Emitir na ordem: comentario de cabecalho, declaracao do modulo com a lista de
   portas, declaracao dos `wire` internos, atribuicoes continuas, `endmodule`.
2. Cabecalho com um comentario curto informando que o codigo foi gerado a partir
   do circuito e que editar a mao desfaz a sincronia (RF12-I03). Nao incluir data
   ou identificador variavel: isso mudaria o texto a cada geracao e quebraria o
   hash de sincronia.
3. Alinhar a formatacao com `samples.ts`: 4 espacos de indentacao, `input wire` /
   `output wire` alinhados, uma atribuicao por linha, `=` alinhado dentro do
   bloco quando melhorar a leitura.
4. Mapear cada operacao para o operador correspondente:
   `and` -> `&`, `or` -> `|`, `not` -> `~`, `xor` -> `^`,
   `nand` -> `~(a & b)`, `nor` -> `~(a | b)`, ligacao direta -> atribuicao
   simples. Usar parenteses de forma explicita em vez de confiar na precedencia -
   e mais legivel para quem esta aprendendo.
5. Suportar portas com mais de duas entradas, encadeando o operador
   (`a & b & c`).
6. Devolver `HdlSources` completo: `language: 'verilog'`, `topModule` com o nome
   do modulo, `design` com nome de arquivo derivado do modulo e o `testbench`
   preservado do que ja existir no projeto - o gerador nunca toca no testbench.
7. Testar comparando com texto esperado, caractere a caractere, para os mesmos
   circuitos de RF13-I01. Testar tambem que o resultado passa em
   `HdlSourcesSchema.parse`.
8. Validar de fato compilando: rodar o codigo gerado pelo sandbox e conferir
   ausencia de erro e de aviso.

## Criterios de aceite

- [ ] O somador completo gerado compila com `iverilog -g2012` sem aviso.
- [ ] O codigo gerado simula com o testbench do exemplo e produz a mesma saida do
      design escrito a mao.
- [ ] A formatacao segue o estilo de `samples.ts`.
- [ ] Portas com mais de duas entradas sao emitidas corretamente.
- [ ] Gerar duas vezes produz texto identico, byte a byte.
- [ ] O resultado valida contra `HdlSourcesSchema`.
- [ ] O testbench existente no projeto nao e alterado.
- [ ] Ha teste comparando a saida com o texto esperado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Compilacao real do codigo gerado:

```bash
docker run --rm -v "$PWD/gerado:/work" -w /work tplab-sandbox:latest \
  iverilog -g2012 -o /tmp/a somador.v
```

## Riscos

- Emitir sem parenteses e confiar na precedencia produz codigo correto e ilegivel
  - o oposto do objetivo da feature.
- Incluir data ou versao no comentario de cabecalho quebra a estabilidade do
  texto e, com ela, a deteccao de edicao manual.

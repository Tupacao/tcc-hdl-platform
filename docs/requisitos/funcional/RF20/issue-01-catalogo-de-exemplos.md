# RF20-I01 - Catalogo de exemplos e verificacao automatizada

| Campo | Valor |
| --- | --- |
| Feature | [RF20](feature.md) |
| Branch | `feat/rf20-catalogo-de-exemplos` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

`apps/web/src/lib/samples.ts` exporta um unico `SAMPLE_SOURCES` - o somador
completo - usado como estado inicial do `Workspace`. O formato do conteudo ja
esta correto (`HdlSources` com design e testbench, testbench com `$dumpfile`,
`$dumpvars`, laco de estimulos e `$finish`); falta a estrutura de catalogo e os
demais exemplos.

O risco especifico desta feature e silencioso: um exemplo que para de compilar
so aparece quando um usuario abre e ve um erro logo no primeiro contato.

## Objetivo

Transformar o exemplo unico em um catalogo com metadados, acrescentar
multiplexador e contador, e garantir por verificacao automatizada que todos
continuam validos.

## Escopo tecnico

- `apps/web/src/lib/samples.ts` - estrutura de catalogo
- `apps/web/src/lib/samples/` (novo) - um modulo por exemplo
- `apps/api/src/modules/simulation/samples.test.ts` (novo) ou script de
  verificacao
- `package.json` - script de verificacao

## Passo a passo

1. Definir o tipo do catalogo: `id`, `title`, `description`, `concepts: string[]`,
   `difficulty`, `sources: HdlSources`. Manter `SAMPLE_SOURCES` exportado
   apontando para o exemplo padrao, para nao quebrar `workspace.tsx` no mesmo
   commit.
2. Separar um modulo por exemplo, para que os arquivos nao virem um so blocao.
3. Escrever o **multiplexador 2:1**: seletor, duas entradas, uma saida;
   testbench percorrendo as combinacoes; conceitos - `assign`, operador ternario,
   selecao.
4. Escrever o **contador de 4 bits**: `clk`, `reset`, saida de 4 bits;
   testbench com geracao de clock (`always #5 clk = ~clk;`), pulso de reset e
   `$finish` depois de N ciclos; conceitos - `always @(posedge clk)`, atribuicao
   nao bloqueante, reset sincrono ou assincrono (escolher e comentar a escolha).
5. Manter o mesmo padrao de qualidade do somador existente: comentarios em
   portugues sem acentuacao, indentacao de 4 espacos, instanciacao por nome,
   `$display` formatado.
6. Garantir que todo exemplo produza `.vcd`: `$dumpfile` e `$dumpvars` sao
   obrigatorios em todos.
7. Escrever a verificacao automatizada: um teste ou script que, para cada
   exemplo, escreve os arquivos em um diretorio temporario, roda `iverilog` e
   `vvp` pelo sandbox e verifica que compila sem aviso, termina com codigo 0 e
   gera `.vcd` nao vazio.
8. Adicionar o script ao `package.json` e documentar no `README.md`, deixando
   claro que ele exige Docker e a imagem `tplab-sandbox:latest`.
9. Conferir que cada conceito citado nos metadados aparece de fato no codigo, e
   que existe na referencia de RF11-I03.

## Criterios de aceite

- [ ] O catalogo tem ao menos somador, multiplexador e contador.
- [ ] Cada exemplo tem titulo, descricao, conceitos e dificuldade.
- [ ] Todos compilam sem aviso e terminam com sucesso.
- [ ] Todos geram `.vcd` nao vazio.
- [ ] O contador exercita clock, reset e atribuicao nao bloqueante.
- [ ] A verificacao automatizada cobre todos os exemplos.
- [ ] O estilo e consistente com o somador ja existente.
- [ ] `workspace.tsx` continua funcionando sem alteracao.

## Verificacao

```bash
pnpm sandbox:build
pnpm --filter @tplab/api test
pnpm typecheck
```

## Riscos

- Verificacao que depende de Docker nao roda em toda maquina; deixar explicito no
  `README.md` e falhar com mensagem clara quando o Docker estiver ausente, em vez
  de erro obscuro.
- Um contador com reset assincrono e um com sincrono ensinam coisas diferentes;
  escolher um, comentar a escolha no codigo e mencionar a alternativa.

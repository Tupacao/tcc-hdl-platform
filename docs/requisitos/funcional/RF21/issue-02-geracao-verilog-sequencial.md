# RF21-I02 - Geracao de Verilog sequencial

| Campo | Valor |
| --- | --- |
| Feature | [RF21](feature.md) |
| Branch | `feat/rf21-geracao-verilog-sequencial` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF21-I01, RF13-I02 |

## Contexto

RF13 gera apenas atribuicoes continuas: cada porta logica vira um `assign`, na
ordem topologica calculada por RF13-I01. Elemento de memoria nao cabe nesse
formato - flip-flop vira um bloco procedural com atribuicao nao bloqueante, e o
sinal de saida precisa ser `reg`, nao `wire`.

A ordenacao topologica tambem muda de papel: com o estado quebrando os ciclos,
ela vale para a parte combinacional, e a parte sequencial e emitida a parte.

## Objetivo

Estender a representacao intermediaria e o emissor para produzir Verilog
sequencial correto e legivel.

## Escopo tecnico

- `apps/web/src/features/circuit/codegen/ir.ts` - registradores
- `apps/web/src/features/circuit/codegen/emit.ts` - blocos procedurais
- `apps/web/src/features/circuit/codegen/*.test.ts`

## Passo a passo

1. Estender a representacao intermediaria com `IrRegister`
   (`{ name, dataSignal, clockSignal, resetSignal, resetValue }`) e separar as
   atribuicoes combinacionais dos registradores em `IrModule`.
2. Adaptar a ordenacao topologica: cortar as arestas de dado que entram em
   registrador, ordenar o restante e emitir a parte combinacional na ordem
   resultante. A saida de um registrador e um valor conhecido de partida, como
   uma entrada.
3. Declarar as saidas de registrador como `reg` e as demais como `wire` - erro
   classico e declarar tudo igual e o `iverilog` recusar a atribuicao dentro de
   `always`.
4. Emitir um bloco procedural por dominio de reset, agrupando os registradores
   que compartilham clock e reset em vez de gerar um `always` por flip-flop -
   o codigo agrupado e mais proximo do que uma pessoa escreveria e mais legivel:

   ```verilog
   always @(posedge clk or posedge rst) begin
       if (rst) begin
           q0 <= 1'b0;
       end else begin
           q0 <= d0;
       end
   end
   ```

5. Usar sempre atribuicao nao bloqueante (`<=`) dentro do bloco sequencial, e
   bloqueante (`=`) apenas onde couber no combinacional. Comentar essa regra no
   codigo gerado - e um dos pontos que mais confunde iniciantes, e o codigo
   gerado e material didatico.
6. Manter o determinismo: gerar duas vezes o mesmo circuito produz texto
   identico, condicao do hash de sincronia de RF12-I03.
7. Tratar o caso sem reset conectado: emitir sem o ramo de reset e registrar o
   aviso correspondente de RF21-I01.
8. Testar por equivalencia: gerar o contador a partir do canvas e simular com o
   **mesmo testbench** do contador de RF20-I01, conferindo que a saida coincide
   com a do design escrito a mao. E o teste mais forte da feature.

## Criterios de aceite

- [ ] Saidas de registrador sao declaradas como `reg`, as demais como `wire`.
- [ ] Registradores com mesmo clock e reset sao agrupados em um bloco.
- [ ] O bloco sequencial usa atribuicao nao bloqueante.
- [ ] O contador gerado compila sem aviso.
- [ ] O contador gerado produz a mesma saida do contador escrito a mao, com o
      mesmo testbench.
- [ ] Circuito sem reset gera codigo valido, sem ramo de reset.
- [ ] Gerar duas vezes produz texto identico.
- [ ] Circuito puramente combinacional continua gerando o mesmo codigo de RF13.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
pnpm --filter @tplab/api test
```

Equivalencia com o exemplo de RF20:

```bash
docker run --rm -v "$PWD/gerado:/work" -w /work tplab-sandbox:latest \
  sh -c 'iverilog -g2012 -o /tmp/a contador.v contador_tb.v && vvp /tmp/a'
```

## Riscos

- Misturar atribuicao bloqueante e nao bloqueante no mesmo bloco produz codigo
  que compila e simula errado - o pior tipo de defeito, porque nao aparece como
  erro. O teste de equivalencia com o exemplo escrito a mao e a protecao.
- Um `always` por flip-flop tambem funciona e e mais simples de gerar; a escolha
  pelo agrupamento e pedagogica, e precisa estar registrada no codigo para nao
  ser "simplificada" depois.

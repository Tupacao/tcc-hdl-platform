# RF11-I03 - Conteudo da referencia de sintaxe Verilog

| Campo | Valor |
| --- | --- |
| Feature | [RF11](feature.md) |
| Branch | `feat/rf11-referencia-sintaxe-verilog` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF11-I01 |

## Contexto

O guia de inicio rapido (RF11-I02) leva o usuario ate a primeira simulacao. Dali
em diante ele precisa escrever codigo proprio, e e onde falta referencia: a
documentacao oficial de Verilog e um padrao IEEE, e os tutoriais na internet
misturam SystemVerilog, que o `iverilog -g2012` aceita apenas em parte.

A referencia precisa ser deliberadamente pequena: cobre o que o publico-alvo
efetivamente usa no primeiro semestre de contato com HDL, e nada alem.

## Objetivo

Entregar uma folha de consulta de Verilog, com exemplos curtos, executaveis e
compativeis com a toolchain da plataforma.

## Escopo tecnico

- `apps/web/src/features/docs/content/referencia-verilog.tsx` (novo)
- `apps/web/src/lib/samples.ts` - exemplos que virarem projeto (RF20)

## Passo a passo

1. Definir o sumario, agrupado por assunto:
   - **Estrutura**: `module`/`endmodule`, portas (`input`, `output`, `inout`),
     parametros (`parameter`), instanciacao com ligacao por nome.
   - **Tipos**: `wire` versus `reg` - quando usar cada um e o erro classico de
     atribuir a `wire` dentro de `always`.
   - **Valores**: numeros com base (`4'b1010`, `8'hFF`, `3'd5`), os niveis `x` e
     `z`, largura e extensao.
   - **Combinacional**: `assign`, operadores logicos, bit a bit, aritmeticos,
     relacionais, concatenacao e replicacao, operador ternario.
   - **Sequencial**: `always @(posedge clk)`, `if`/`else`, `case`,
     bloqueante (`=`) versus nao bloqueante (`<=`) - com a regra pratica.
   - **Testbench**: `initial`, atrasos `#`, `$display`, `$monitor`, `$dumpfile`,
     `$dumpvars`, `$finish`, geracao de clock.
   - **Comentarios e diretivas**: `//`, `/* */`, `` `define ``, `` `timescale ``.
2. Cada entrada segue o mesmo formato: para que serve (uma frase), exemplo minimo
   e uma armadilha comum, quando houver.
3. Todo exemplo precisa compilar de fato com `iverilog -g2012`. Verificar cada um
   contra a toolchain antes de publicar - exemplo errado na documentacao e pior
   que exemplo ausente.
4. Marcar explicitamente o que **nao** e suportado ou nao e recomendado no MVP
   (construcoes de SystemVerilog, `logic`, `always_ff`), porque e o que o usuario
   vai encontrar na internet e tentar colar.
5. Ligar a referencia as explicacoes de erro de RF05-I03: um erro de "largura
   incompativel" no console pode apontar para a secao de valores.
6. Ligar tambem aos exemplos de RF20: cada exemplo pre-carregado cita as secoes
   que usa.
7. Revisar a terminologia em portugues e mante-la consistente com o resto da
   interface.

## Criterios de aceite

- [ ] A referencia cobre todos os assuntos do sumario acima.
- [ ] Todo exemplo compila com `iverilog -g2012` sem aviso.
- [ ] Cada entrada tem proposito, exemplo e, quando cabe, armadilha comum.
- [ ] As construcoes fora do escopo estao explicitamente marcadas.
- [ ] Os elementos usados pelos exemplos de RF20 estao todos documentados.
- [ ] O vocabulario e consistente com o restante da interface.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Validacao dos exemplos, com a imagem do sandbox construida:

```bash
docker run --rm -v "$PWD/exemplos:/work" -w /work tplab-sandbox:latest \
  sh -c 'for f in *.v; do iverilog -g2012 -o /tmp/a "$f" || echo "FALHOU: $f"; done'
```

## Riscos

- Referencia que cresce sem criterio vira um LRM ruim; a regra e entrar apenas o
  que aparece nos exemplos e nos erros reais dos usuarios.
- Exemplos isolados que nao compilam sozinhos (um `always` sem modulo em volta)
  confundem; cada bloco deve ser completo ou marcado claramente como fragmento.

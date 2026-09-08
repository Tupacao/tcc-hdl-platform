# RF04-I01 - Contrato de testbench e coerencia do modulo de topo

| Campo | Valor |
| --- | --- |
| Feature | [RF04](feature.md) |
| Branch | `feat/rf04-contrato-testbench` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

`HdlSourcesSchema` exige `topModule`, mas `infra/sandbox/run-simulation.sh` roda
`iverilog` **sem** `-s`: quem escolhe o topo e a propria toolchain, elegendo o
modulo que ninguem instancia. Na pratica isso funciona quando o testbench
instancia o design, e falha de formas confusas quando nao instancia - o
`iverilog` elege o modulo errado e a simulacao termina sem fazer nada, com codigo
de saida `0`.

O mesmo vale para o `.vcd`: `readVcd` procura qualquer arquivo `.vcd` no workdir.
Se o testbench nao chama `$dumpfile`/`$dumpvars`, nao existe arquivo, o campo
`vcd` volta `null` e o `WaveformPanel` mostra "Nenhuma forma de onda ainda" - uma
mensagem que descreve o sintoma mas nao a causa.

## Objetivo

Tornar explicito o contrato que a plataforma espera do testbench e detectar as
tres incoerencias mais comuns antes ou logo depois da execucao, com mensagens que
ensinem o que corrigir.

## Escopo tecnico

- `packages/shared/src/schemas/hdl.ts` - eventual refinamento do schema.
- `apps/api/src/modules/simulation/testbench.ts` (novo) - analise estatica leve.
- `apps/api/src/modules/simulation/routes.ts` - avisos na resposta de submissao.
- `apps/api/src/worker.ts` - avisos derivados do resultado da execucao.
- `packages/shared/src/schemas/simulation.ts` - diagnosticos de severidade
  `warning` gerados pela plataforma.
- `infra/sandbox/run-simulation.sh` - somente se for necessario um segundo passo.

## Passo a passo

1. Escrever um analisador textual simples (regex, sem parser completo de Verilog)
   que responda tres perguntas sobre o par design/testbench:
   - o testbench contem uma instanciacao cujo nome de modulo e `topModule`?
   - o design declara `module <topModule>`?
   - o testbench menciona `$dumpfile` e `$dumpvars`?
2. Deixar claro no codigo que a analise e heuristica: comentarios e strings podem
   enganar o regex. Na duvida, emitir `warning`, nunca `error` - a submissao segue
   para a fila de qualquer modo.
3. Emitir os avisos como `Diagnostic` com `severity: 'warning'`, `file` apontando
   para o arquivo relevante e `raw` identificando a origem (`tplab`, nao
   `iverilog`), para que RF05 os exiba no mesmo console sem tratamento especial.
4. Depois da execucao, se `failure` for `null` e `vcd` for `null`, anexar um aviso
   explicando `$dumpfile("saida.vcd")` e `$dumpvars(0, <tb>)` com um exemplo
   copiavel.
5. Se a simulacao terminar com `stdout` vazio e sem `.vcd`, avisar que o testbench
   possivelmente nao instanciou o design.
6. Cobrir o analisador com testes em `node:test`, no padrao de
   `diagnostics.test.ts`: casos positivos, negativos, instanciacao com parametros
   (`#(.WIDTH(8))`), instanciacao com quebra de linha e mencao dentro de
   comentario.
7. Documentar o contrato do testbench no `README.md` e reaproveitar o texto em
   RF11 (guia de inicio rapido).

## Criterios de aceite

- [ ] Testbench que nao instancia o `topModule` gera aviso antes da execucao.
- [ ] Design que nao declara o `topModule` gera aviso antes da execucao.
- [ ] Testbench sem `$dumpvars` gera aviso com exemplo copiavel.
- [ ] Os avisos aparecem no console de RF05 junto com os diagnosticos do
      `iverilog`, sem componente novo.
- [ ] Nenhum aviso impede a submissao - todos sao `warning`.
- [ ] Os exemplos de `apps/web/src/lib/samples.ts` nao geram nenhum aviso.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api test
pnpm typecheck
```

Manual: remover `$dumpvars` do testbench de exemplo, executar e conferir o aviso.

## Riscos

- Regex sobre Verilog gera falso positivo com facilidade (instanciacao em varias
  linhas, macros de `` `define ``). Falso positivo em `warning` custa pouco; o
  mesmo erro em `error` bloquearia usuario legitimo - por isso a regra de nunca
  bloquear.
- Passar a usar `iverilog -s <topModule>` resolveria a eleicao do topo, mas
  mudaria o comportamento de todos os testbenches existentes: fica fora desta
  issue e so deve ser considerado com o contrato ja documentado.

# RF04-I01 - Contrato de testbench e coerencia do modulo de topo

| Campo | Valor |
| --- | --- |
| Feature | [RF04](feature.md) |
| Branch | `feat-RF04-01-contrato-testbench-back` |
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

- [x] Testbench que nao instancia o `topModule` gera aviso antes da execucao.
      _(verificado ao vivo — ver Nota de implementacao)_
- [x] Design que nao declara o `topModule` gera aviso antes da execucao.
- [x] Testbench sem `$dumpvars` gera aviso com exemplo copiavel.
      _(verificado ao vivo)_
- [x] Os avisos aparecem no console de RF05 junto com os diagnosticos do
      `iverilog`, sem componente novo. _(sao `Diagnostic` normais no mesmo
      array; `ConsolePanel` ja existente renderiza sem mudanca)_
- [x] Nenhum aviso impede a submissao - todos sao `warning`.
- [x] Os exemplos de `apps/web/src/lib/samples.ts` nao geram nenhum aviso.
      _(o par design/testbench de `samples.ts` foi copiado para
      `testbench.test.ts` — apps/api e apps/web nao se importam entre si no
      monorepo; se o exemplo mudar, o teste precisa acompanhar)_

## Nota de implementacao

"Antes da execucao" e "antes de gastar container" (criterio da feature) sao
sobre a ORIGEM do aviso — analise textual, nao o resultado do `iverilog` —, nao
sobre pular a execucao: a submissao sempre roda no sandbox mesmo com avisos.
As checagens estaticas rodam no worker, logo no inicio do processamento do
job, antes de qualquer coisa do resultado existir; ficam junto com o aviso
pos-execucao (`vcd` nulo sem falha) no mesmo array `diagnostics` devolvido ao
cliente.

Nao ficou nesta branch: reaproveitar o texto do contrato do testbench no guia
"Primeiro projeto" de RF11 (`apps/web/src/features/docs/content/inicio-rapido.tsx`)
— e mudanca de frontend/conteudo, fora do escopo de uma branch de backend
(`docs/ARCHITECTURE.md`), e o passo 7 do passo-a-passo original nao e um
criterio de aceite. O texto do contrato ja esta documentado no `README.md`.

Tambem nao ficou nesta branch: o estado vazio do `WaveformPanel` com o card
"A simulação rodou, mas nada foi gravado" (copiavel, botao "Inserir no
testbench") do Figma 5.1 — hoje o painel ja mostra uma dica textual generica
sobre `$dumpfile`/`$dumpvars` (`apps/web/src/features/workspace/utils/messages.ts`),
que cobre o criterio "a interface explica por que nao ha forma de onda" da
feature; o card completo do Figma e uma melhoria de UI, nao coberta pelos
criterios desta issue especifica.

Verificado ao vivo contra o pipeline real (worker + API deste ambiente):
submeti um testbench que instancia um modulo diferente do `topModule`
declarado e nao chama `$dumpvars` — a simulacao terminou `succeeded`,
`failure: null`, e o resultado trouxe os dois avisos esperados, sem nenhum
erro:

```
[warning] full_adder_tb.v: O testbench nao parece instanciar "full_adder"...
[warning] full_adder_tb.v: O testbench nao chama $dumpfile/$dumpvars...
```

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

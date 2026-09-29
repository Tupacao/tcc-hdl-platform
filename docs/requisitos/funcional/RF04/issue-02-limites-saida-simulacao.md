# RF04-I02 - Limites e truncamento da saida da simulacao

| Campo | Valor |
| --- | --- |
| Feature | [RF04](feature.md) |
| Branch | `feat-RF04-02-limites-saida-simulacao-back` + `-front` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

`sandbox.ts` limita o `.vcd` por `MAX_VCD_BYTES` (8 MB) e corta com
`content.slice(0, MAX_VCD_BYTES)`, no meio de onde calhar. O `stdout` e o
`stderr` nao tem limite nenhum: um `$display` dentro de um `always` sem controle
de tempo produz saida sem fim ate o timeout, e todo esse texto atravessa o Redis
(como `returnvalue` do job) e o JSON da resposta ate o navegador.

O corte cego do `.vcd` tambem e um problema pratico: o parser de RF06 vai receber
um arquivo que termina no meio de um valor.

## Objetivo

Impor tetos explicitos a cada artefato da simulacao, cortar em fronteira segura e
avisar o usuario de que houve corte - em vez de entregar dado truncado em
silencio.

## Escopo tecnico

- `apps/api/src/modules/simulation/sandbox.ts` - `readVcd`, `demuxDockerLogs` e
  a montagem do `SandboxOutcome`.
- `apps/api/src/config/env.ts` - tetos configuraveis.
- `packages/shared/src/schemas/simulation.ts` - sinalizacao de truncamento.
- `apps/web/src/features/workspace/console-panel.tsx` e `waveform-panel.tsx` -
  exibicao do aviso.
- `infra/sandbox/run-simulation.sh` - corte na origem, se necessario.

## Passo a passo

1. Adicionar em `env.ts`: `MAX_STDOUT_BYTES` (default 256 KB), `MAX_STDERR_BYTES`
   (default 64 KB) e `MAX_VCD_BYTES` (default 2 MB, hoje constante fixa no
   modulo).
2. Cortar `stdout`/`stderr` **pelo fim** - as ultimas linhas costumam ser as
   informativas quando ha erro - e prefixar com uma linha indicando quantos bytes
   foram descartados.
3. Cortar o `.vcd` **pelo inicio do arquivo** (o cabecalho `$var` e obrigatorio
   para interpretar os valores) e sempre no fim de uma linha completa: localizar o
   ultimo `\n` antes do teto.
4. Acrescentar ao `SimulationResultSchema` um objeto `truncated` com flags por
   artefato (`stdout`, `stderr`, `vcd`), em vez de depender de heuristica no
   cliente. Rodar `pnpm --filter @tplab/shared build` apos a mudanca.
5. Considerar cortar na origem, dentro do container: encanar o `vvp` por
   `head -c` no `run-simulation.sh` evita transportar megabytes de log pelo socket
   do Docker. Se implementado, o codigo de saida do `vvp` precisa ser preservado
   (`set -o pipefail` nao existe no `/bin/sh` do Alpine - usar arquivo temporario
   em `/tmp`, que ja e montado como tmpfs).
6. Exibir o aviso de truncamento no `ConsolePanel` e no `WaveformPanel`, com o
   motivo e a orientacao (reduzir `$dumpvars`, reduzir tempo simulado, remover
   `$display` de dentro de loop).
7. Testar com um testbench que imprime em loop e com outro que gera `.vcd` grande.

## Criterios de aceite

- [x] `stdout` acima do teto chega cortado, com as ultimas linhas preservadas e
      aviso do corte. _(back — verificado ao vivo: testbench com 20 mil
      `$display` voltou com `stdout.length` no teto exato e terminando na
      linha de `$finish`, a mais informativa)_
- [x] `.vcd` acima do teto chega cortado no fim de uma linha, com o cabecalho
      intacto. _(back — mesma logica de RF03-I03, agora com o teto vindo de
      `env.MAX_VCD_BYTES`)_
- [x] `result.truncated` indica corretamente qual artefato foi cortado. _(back)_
- [x] A interface avisa o corte em vez de mostrar dado incompleto sem contexto.
      _(front — `ConsolePanel` mostra um aviso quando `truncated.stdout` ou
      `truncated.stderr`; `WaveformPanel` recebe `truncated.vcd` direto do
      backend, alem da deteccao que ja existia no parser de RF06)_
- [x] Uma simulacao normal dos exemplos nao dispara nenhum aviso de
      truncamento. _(os testes de `sandbox.test.ts` cobrem o caso "cabe no
      limite"; os exemplos de `samples.ts` ficam bem abaixo dos tetos)_

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api test
pnpm typecheck
```

Manual: testbench com `always #1 $display("x");` e sem `$finish`.

## Nota de implementacao

Dividido em duas branches (`docs/ARCHITECTURE.md` — front e back nunca
compartilham branch): `feat-RF04-02-limites-saida-simulacao-back` cobre
`env.ts`, `sandbox.ts`, `worker.ts`, `routes.ts` e `SimulationResultSchema`;
`-front` cobre `ConsolePanel` e `WaveformPanel`.

`ConsolePanel` mostra um aviso (`border-warning`, mesmo padrao visual do
aviso ja existente em `WaveformPanel`) quando `result.truncated.stdout` ou
`result.truncated.stderr`. `WaveformPanel` ganhou uma prop `truncated`
alimentada por `result.truncated.vcd`: o aviso que ja existia ali dependia
so do parser (RF06) detectar um registro incompleto no fim do arquivo, o que
nunca acontece com o corte do backend (sempre no fim de uma linha completa)
— sem esse novo sinal explicito, um `.vcd` cortado pelo backend nao mostrava
nenhum aviso.

Verificado ao vivo no navegador apos o merge (a MCP do chrome-devtools tinha
caido no meio da sessao anterior e so reconectou depois): um testbench com 20
mil `$display` (sem instanciar o `topModule`, so pra estourar `stdout`) voltou
com o banner "Parte da saida (stdout/stderr) foi descartada para nao
sobrecarregar o navegador..." acima da lista de diagnosticos, seguido da
marca `[1306851 bytes descartados do inicio]` e a cauda mantida. Um segundo
testbench, instanciando `full_adder` de verdade por 200 mil ciclos (mesmo
gerador do `.vcd` de ~2 MiB ja usado na verificacao da branch de backend),
voltou com "O arquivo .vcd foi truncado; a forma de onda pode estar
incompleta." no `WaveformPanel` — confirmando que o sinal vem mesmo de
`result.truncated.vcd` (o parser sozinho nunca deteta esse corte, exatamente
o gap que esta issue fechou).

O corte na origem (passo 5 — `head -c` dentro do container, via
`run-simulation.sh`) ficou fora: o problema que resolveria (bytes demais
atravessando o socket do Docker) so aparece em escala bem maior que qualquer
simulacao real do MVP produz, e mexer no `/bin/sh` do Alpine sem
`pipefail` para preservar o codigo de saida do `vvp` e risco desproporcional
ao ganho agora — revisar se RNF07-I02 (medicao de overhead do Docker)
apontar isso como gargalo real.

## Riscos

- Cortar o `.vcd` sempre reduz a janela de tempo visivel em RF06; a alternativa
  (streaming ou download separado do arquivo) e maior e fica fora do MVP.
- Interage diretamente com RF03-I03 (retencao): decidir os tetos uma vez so, nos
  dois lugares, para nao ter dois numeros divergentes.

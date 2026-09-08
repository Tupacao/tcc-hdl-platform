# RF04-I02 - Limites e truncamento da saida da simulacao

| Campo | Valor |
| --- | --- |
| Feature | [RF04](feature.md) |
| Branch | `feat/rf04-limites-saida-simulacao` |
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

- [ ] `stdout` acima do teto chega cortado, com as ultimas linhas preservadas e
      aviso do corte.
- [ ] `.vcd` acima do teto chega cortado no fim de uma linha, com o cabecalho
      intacto.
- [ ] `result.truncated` indica corretamente qual artefato foi cortado.
- [ ] A interface avisa o corte em vez de mostrar dado incompleto sem contexto.
- [ ] Uma simulacao normal dos exemplos nao dispara nenhum aviso de truncamento.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api test
pnpm typecheck
```

Manual: testbench com `always #1 $display("x");` e sem `$finish`.

## Riscos

- Cortar o `.vcd` sempre reduz a janela de tempo visivel em RF06; a alternativa
  (streaming ou download separado do arquivo) e maior e fica fora do MVP.
- Interage diretamente com RF03-I03 (retencao): decidir os tetos uma vez so, nos
  dois lugares, para nao ter dois numeros divergentes.

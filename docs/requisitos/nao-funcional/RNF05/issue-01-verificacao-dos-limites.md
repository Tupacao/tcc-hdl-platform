# RNF05-I01 - Verificacao dos limites e fidelidade do desfecho

| Campo | Valor |
| --- | --- |
| Feature | [RNF05](feature.md) |
| Branch | `chore/rnf05-verificacao-dos-limites` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

Os limites estao configurados, mas nunca foi verificado que cada um dispara e que
o usuario recebe o desfecho correto. Ha um ponto especificamente fragil no
mapeamento de `sandbox.ts`:

```ts
case EXIT_TIMEOUT:   return 'timeout';      // 124
case EXIT_KILLED:    return 'memory_limit'; // 137
```

O 137 e o codigo de qualquer processo morto por `SIGKILL`. O
`run-simulation.sh` ja converte o 137 do `vvp` em 124, o que resolve o caso
comum - mas um processo morto pelo OOM killer em outro ponto, ou o proprio script
morto, cai no 137 e e reportado como estouro de memoria sem ter estourado nada.

Ha tambem uma lacuna real: `timeout -s KILL` no script cobre apenas o `vvp`. Uma
compilacao que nao termina - macro recursiva, `` `include `` circular - fica
presa ate o `killTimer` do host, cinco segundos alem do limite.

## Objetivo

Verificar cada limite com um caso real e garantir que o desfecho reportado
corresponde a causa.

## Escopo tecnico

- `infra/sandbox/run-simulation.sh` - timeout na compilacao
- `apps/api/src/modules/simulation/sandbox.ts` - `mapFailure`
- `apps/api/src/modules/simulation/sandbox.test.ts` (novo)
- `docs/SEGURANCA.md` - resultados

## Passo a passo

1. Escrever um caso por limite, submetido pelo fluxo normal:
   - **timeout de simulacao**: testbench com `always` sem `$finish`;
   - **timeout de compilacao**: macro recursiva ou `` `include `` circular;
   - **memoria**: vetor gigantesco (`reg [31:0] mem [0:100000000]`);
   - **PIDs**: se possivel dentro do Verilog, ou verificado por `docker run`
     equivalente;
   - **CPU**: laco pesado, confirmando que o limite atrasa sem travar o host.
2. Para cada caso, conferir o `failure` que chega ao cliente e a mensagem
   exibida.
3. Cobrir o `iverilog` com timeout no `run-simulation.sh`, usando um valor
   proprio (a compilacao deveria ser bem mais rapida que a simulacao) e um codigo
   de saida distinto, para o usuario saber se travou compilando ou simulando.
   Qualquer codigo novo exige atualizar `mapFailure` e `SimulationFailureSchema`
   - o acoplamento esta registrado em `CLAUDE.md`.
4. Tornar a deteccao de memoria confiavel: consultar o `State.OOMKilled` do
   container (`docker inspect`, disponivel pelo `dockerode`) em vez de deduzir
   pelo codigo de saida. E o dado autoritativo.
5. Manter o 137 como desfecho de ultimo recurso, mapeado para `internal_error` em
   vez de `memory_limit`, quando o `OOMKilled` for falso.
6. Escrever testes unitarios de `mapFailure` cobrindo cada combinacao de codigo
   de saida e `OOMKilled`, sem depender do Docker.
7. Conferir que alterar `SANDBOX_TIMEOUT_MS`, `SANDBOX_MEMORY_MB` e
   `SANDBOX_CPUS` muda o comportamento de fato - variavel que nao surte efeito e
   pior que ausencia de variavel.
8. Registrar os resultados em `docs/SEGURANCA.md`.

## Criterios de aceite

- [ ] Cada limite tem caso de teste e resultado registrado.
- [ ] Simulacao sem `$finish` reporta `timeout`.
- [ ] Estouro de memoria reporta `memory_limit`, confirmado por `OOMKilled`.
- [ ] Morte por `SIGKILL` sem OOM nao e reportada como `memory_limit`.
- [ ] Compilacao infinita e interrompida e reportada de forma distinguivel.
- [ ] `mapFailure` tem teste para cada combinacao.
- [ ] As tres variaveis de ambiente surtem efeito verificado.
- [ ] Os codigos de saida do script e `mapFailure` estao consistentes.

## Verificacao

```bash
pnpm sandbox:build
pnpm --filter @tplab/api test
pnpm typecheck
```

Manual: submeter cada caso pela interface e conferir a mensagem.

## Riscos

- Acrescentar codigo de saida ao script sem atualizar `mapFailure` produz
  `internal_error` generico e some com a informacao; mudar os dois no mesmo
  commit.
- O `killTimer` de 5 s de margem em `sandbox.ts` pode mascarar a falha do timeout
  interno: se o script parar de funcionar, tudo continua "funcionando" com 5 s a
  mais. Registrar no log quando o `killTimer` for quem matou.

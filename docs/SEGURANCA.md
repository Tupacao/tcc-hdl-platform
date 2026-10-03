# Segurança do sandbox de execução — RNF04 / RNF05

> Modelo de ameaça, resultados das auditorias e decisões de risco do pipeline
> que executa código de terceiros. Cada seção cita a issue que a produziu. A
> auditoria é repetível: `pnpm sandbox:build && pnpm --filter @tplab/api
test:sandbox` roda contra o Docker real (não entra em `pnpm test`, que é
> rápido e não exige a imagem); `pnpm --filter @tplab/api test` cobre a
> integridade das opções do container sem Docker.

## 1. Modelo de ameaça (RNF04-I01)

**Atacante.** Qualquer pessoa na internet, sem conta (o uso anônimo é
requisito, RF01), enviando código Verilog arbitrário por
`POST /api/simulations`. Inclui o aluno que escreve um `always` sem `#` por
engano — o caso mais comum não é malicioso, é acidental.

**O que ele quer.**

| Objetivo | Exemplo |
| --- | --- |
| Sair do container | alcançar o host ou o Docker |
| Ler dados que não são dele | variáveis de ambiente da API (`DATABASE_URL`), arquivos do host, código de outro usuário |
| Consumir a máquina | laço infinito, alocação gigante, _fork bomb_, disco |
| Atacar terceiros | usar a VM como origem de tráfego |

**O que o protege** (barreiras de `buildSandboxContainerOptions`, em
`apps/api/src/modules/simulation/sandbox.ts`):

| Barreira | Configuração | O que impede |
| --- | --- | --- |
| Rede | `NetworkMode: 'none'`, `NetworkDisabled` | exfiltração, uso como pivô |
| Sistema de arquivos | `ReadonlyRootfs`; único bind é o workdir do job | alterar a imagem, ler o host |
| Escrita temporária | `Tmpfs /tmp` com `noexec,nosuid,size=32m` | executar binário gravado |
| Privilégios | `CapDrop: ['ALL']`, `no-new-privileges`, `User: sandbox` (uid 10001) | escalar privilégio |
| Recursos | `Memory` = `MemorySwap`, `NanoCpus`, `PidsLimit: 128` | esgotar a máquina |
| Tempo | `timeout -s KILL` no script + `killTimer` no host | laço infinito |
| Ambiente | `Env` só com `SIM_TIMEOUT_S` | vazar segredo da API |
| Ciclo de vida | container efêmero, removido no `finally`; varredura de órfãos | acúmulo de containers |

**Fora do escopo do modelo** (ver `docs/requisitos/nao-funcional/RNF04/feature.md`):
isolamento por VM/gVisor/Kata, por tenant, detecção de intrusão, auditoria
externa. O isolamento protege contra o **código do usuário**, não contra uma
falha no próprio worker — ver a seção do socket do Docker, abaixo.

## 2. Resultados da auditoria das barreiras (RNF04-I01)

Ambiente: Docker 29.5.3 (Rancher Desktop, WSL2, cgroup v2, kernel
6.6.87.2), imagem `tplab-sandbox:latest` (Alpine 3.20, Icarus Verilog 12.0).
Cada caso roda com **as mesmas opções** de `runInSandbox`
(`buildSandboxContainerOptions`).

`$system` **não existe** nesta build do Icarus (`System task/function
$system() is not defined by any module`), então os vetores de "executar comando
do sistema" não são exploráveis por Verilog. Para verificar mesmo assim que as
barreiras do container aguentam, os casos abaixo rodam um shell dentro do
container com as opções idênticas (o que um escape de execução alcançaria).

| Barreira | Caso | Resultado |
| --- | --- | --- |
| Rede | `wget -T 3 http://1.1.1.1`; `nslookup`; `ls /sys/class/net` | `Network unreachable`; sem resolvedor; só a interface `lo` |
| Escrita | `touch /etc/x`, `/usr/x`, `/x`, `/work/../x` | `Read-only file system` (exit 1) nos quatro; só `/work` aceita escrita |
| Execução em `/tmp` | gravar `x.sh` e um binário copiado em `/tmp` e executar | `Permission denied` (exit 126); `mount` mostra `tmpfs … noexec,nosuid` |
| Privilégio | `id`; `/proc/self/status` | uid 10001; `CapInh/Prm/Eff/Bnd/Amb = 0`; `NoNewPrivs: 1`; `Seccomp: 2`; `su`: `must be suid` |
| Ambiente | `env` | `HOME`, `HOSTNAME`, `PATH`, `PWD`, `SHLVL`, `SIM_TIMEOUT_S` — nenhuma variável da API |
| Host | `ls /var/run/docker.sock`; `ls /`; `mount` | socket ausente; só a árvore da imagem, `/work` e `/tmp` |
| PIDs | laço de 400 `sleep &` | `can't fork: Resource temporarily unavailable` no limite de 128 |
| Memória | acumular string até estourar (limite reduzido a 64 MB) | exit 137 e `State.OOMKilled = true` |
| Memória (Verilog) | `reg [31:0] mem [0:200000000]` | processo morto (`Killed`) — ver a nota de fidelidade do desfecho, seção 4 |
| Tempo | `always #1 a = ~a;` sem `$finish` | `timeout` em ~12,9 s (10 s + criação/leitura do container) |
| Rede / escrita (Verilog) | `$fopen("/etc/pwn")`, `("/usr/pwn")`, `("/pwn")`, `("/work/../pwn")` | `fd = 0` (falhou) nos quatro; `$fopen("/work/ok.txt")` funciona |
| Escrita do VCD | `$dumpfile("/etc/x.vcd")`, `("../x.vcd")` | `VCD Error … Unable to open` → `runtime_error`, sem VCD |

Nenhum caso escapou, escreveu fora do workdir, alcançou a rede ou viu
variável da API.

### Limpeza e worker morto no meio de uma execução

O `finally` de `runInSandbox` remove o container e o diretório de trabalho — mas
**não roda** se o processo do worker for encerrado à força (`kill -9`, OOM do
host, queda da VM). Reproduzido: um worker filho morto com `SIGKILL` 4 s depois
de iniciar uma simulação infinita deixou um container `Exited (124)` (parado
pelo `timeout` do script, mas nunca removido) e o diretório `hdl-sim-*` com os
fontes do usuário em `/tmp`.

Correção: todo container de simulação recebe o rótulo `tplab.sandbox=true`, e o
worker varre ao iniciar e a cada 5 minutos:

- **containers** com o rótulo, parados (qualquer idade) ou rodando há mais que o
  teto do job + margem (`removeOrphanSandboxContainers`);
- **diretórios** `hdl-sim-*` mais velhos que o teto do job + 60 s
  (`removeOrphanWorkdirs`).

Reproduzindo o mesmo cenário depois da correção: a varredura imediata não
removeu nada (container ainda rodando e novo — poderia ser de outro worker); após
o `timeout` do script parar o container, a varredura removeu 1 container e 1
diretório, e `docker ps -a --filter label=tplab.sandbox` voltou vazio.

Limitação registrada: a varredura pressupõe um worker por VM (o MVP). Com vários
workers, um container _rodando e novo_ de outro worker nunca é tocado (o critério
de idade protege), mas um container _parado_ de outro worker no instante
exato entre o `wait` e o `remove` poderia ser removido antes — inofensivo, pois
quem o criou só perde a limpeza que ia fazer de qualquer forma.

### Teste automatizado das opções (sem Docker)

`sandbox.security.test.ts` confere, chave a chave, todas as barreiras da tabela
do modelo de ameaça: o Docker ignora em silêncio uma opção com nome errado, e um
erro de digitação desligaria a proteção sem ninguém perceber. Roda em
`pnpm --filter @tplab/api test` e no CI.

## 3. Como repetir

```bash
pnpm sandbox:build
pnpm --filter @tplab/api test          # opções do container, sem Docker
pnpm --filter @tplab/api test:sandbox  # 13 casos contra o Docker real
docker ps -a --filter label=tplab.sandbox   # não deve listar nada depois
```

Qualquer alteração em `sandbox.ts`, `infra/sandbox/Dockerfile` ou
`run-simulation.sh` exige repetir.

## 4. Limites e fidelidade do desfecho (RNF05-I01)

Os limites configurados existiam, mas o desfecho reportado ao usuário não
correspondia à causa em dois casos e um limite estava descoberto. Estado
antes → depois, reproduzido com o fluxo real (`runInSandbox`):

| Caso | Antes | Depois |
| --- | --- | --- |
| Simulação sem `$finish` | `timeout` (exit 124), ~12,9 s | `timeout`, fase `simulate`, exit 124 |
| Estouro de memória no `vvp` | **`timeout`** (o script convertia todo 137 em 124) | `memory_limit`, `OOMKilled = true` |
| Estouro de memória no `iverilog` (macro recursiva) | **`compile_error`** (`\|\| exit 2`) | `memory_limit` se o Docker marcou `OOMKilled`; senão `internal_error` |
| `` `include `` circular / compilação infinita | **preso até o `killTimer` do host** (~23,8 s), reportado `timeout` | interrompido pelo `timeout` próprio (`SANDBOX_COMPILE_TIMEOUT_MS`, 5 s), exit **4**, fase `compile` |
| `kill -9` de um processo, sem OOM | `memory_limit` (137) | `internal_error` — não acusa o usuário |

Mudanças (script e `mapFailure` no mesmo commit, como o acoplamento exige):

- `run-simulation.sh`: `iverilog` passa a rodar sob `timeout -s KILL` com teto
  próprio; **4** = timeout da compilação; o script deixa de rotular como `124` um
  SIGKILL que aconteceu _antes_ do limite (mede o tempo decorrido) e devolve
  **137** nesses casos. Códigos: 0 / 2 / 3 / 4 / 124 / 137.
- `sandbox.ts`: memória é decidida por `State.OOMKilled` (`docker inspect`), o
  dado autoritativo — vale mesmo se o script devolveu 124 ou 2. 137 sem OOM vira
  `internal_error`. A leitura de logs tolera container morto (`409` "dead or
  marked for removal", visto quando o PID 1 morre por OOM). O `killTimer` agora
  cobre compilação + simulação + margem e, quando dispara, o worker registra
  `killTimer do host encerrou o job` (o timeout interno falhou).
- `limits.ts`: limite atingido vira **erro no console com causa provável e
  próximo passo** (contrato `DiagnosticSchema` que RF05 já renderiza): timeout da
  simulação (`$finish` / laço sem `#`), da compilação (`` `define `` recursivo /
  `` `include `` circular) e memória (vetor grande demais). Erro interno não
  acusa o código do usuário.

Ressalva conhecida: o tempo decorrido tem resolução de 1 s, então um OOM a menos
de 1 s do limite de tempo pode sair do script como 124 — o `OOMKilled` do Docker,
consultado pelo host, corrige esse caso (foi o que aconteceu no teste de
memória do Verilog: exit 124 com `oomKilled = true` → `memory_limit`).

### PIDs e CPU

- **PIDs**: coberto na seção 2 (`can't fork` no limite de 128).
- **CPU**: `NanoCpus` limita por cota do cgroup (o processo atrasa, não trava o
  host); o efeito aparece no tempo de execução e é medido em RNF05-I02.

### As variáveis surtem efeito

`sandbox.integration.ts` sobe um processo filho com `SANDBOX_TIMEOUT_MS=4000`,
`SANDBOX_COMPILE_TIMEOUT_MS=2000`, `SANDBOX_MEMORY_MB=48`, `SANDBOX_CPUS=0.25` e
confere que chegam aos limites e às opções do container (`SIM_TIMEOUT_S=4`,
`SIM_COMPILE_TIMEOUT_S=2`, `Memory` = 48 MiB, `NanoCpus` = 0,25e9); os testes de
tempo e de memória passam limites reduzidos a `runInSandbox` e conferem o
comportamento efetivo (timeout em 3 s, OOM a 32 MB).

## 5. Achados que alimentam as outras issues

- **Permissão do workdir e `/tmp` compartilhado** — RNF04-I03 e RNF04-I02.

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

## 4. Achados que alimentam as outras issues

- **Fidelidade do desfecho de memória (RNF05-I01).** O estouro de memória do
  `vvp` chegou ao cliente como `timeout` (o script converte todo `137` do `vvp`
  em `124`), e o do `iverilog` como `compile_error` (`|| exit 2`). O desfecho
  `memory_limit` nunca aparece pelo caminho normal.
- **`iverilog` fora do `timeout` (RNF05-I01, RNF04-I03).** Um
  `` `include `` circular prendeu o worker por ~23,8 s (teto interno de 10 s +
  `killTimer` de 5 s + criação/logs), e só saiu pelo `killTimer` do host.

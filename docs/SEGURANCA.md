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
`apps/api/src/infra/sandbox/sandbox.ts`):

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
| Macro recursiva (`` `define A `B ``/`` `define B `A ``) | **`compile_error`** com `Killed` (OOM do `iverilog` lido como erro de compilação) | interrompida em 5 s pelo `timeout` próprio (exit **4**, fase `compile`); se a memória estourar antes, `memory_limit` por `OOMKilled` |
| `` `include `` circular | **preso até o `killTimer` do host** (~23,8 s) | termina em poucos segundos: o limite de descritores de RNF04-I03 (`ulimit -n 64`) faz a recursão falhar (`Include file tb.v not found`) |
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

### Limite de memória sem contabilidade de swap (achado ao repetir a verificação)

Na máquina de desenvolvimento (Rancher Desktop / WSL2) `docker info` informa
`SwapLimit=false`: o kernel do WSL2 tem uma partição de swap e o Docker não a
contabiliza por container, então **`MemorySwap = Memory` não é aplicado**. Efeito
medido: um `sh` que dobra uma string sob limite de 32 MB **não foi morto por OOM
por 166 s** (paginou para o swap), e um teste desse tipo falhou de forma
intermitente (`OOMKilled = false`, container "dead or marked for removal"). Quando
o OOM acontece, o desfecho está correto (`memory_limit` por `OOMKilled`, visto em
todas as execuções que o dispararam) — o problema é o **quando**.

Consequências e tratamento:

- **Na VM (Azure B2s, Ubuntu)** o limite de memória só protege a máquina se o
  kernel contabilizar swap ou se a VM não tiver swap (o padrão do Azure é sem
  swap). Verificar no deploy (RF01-I02): `docker info --format '{{.SwapLimit}}'`
  deve ser `true`, ou `swapon --show` deve estar vazio.
- O worker agora **avisa no start** quando `SwapLimit=false` (log `warn`), para a
  falha não ser silenciosa.
- Os dois testes de memória de `test:sandbox` são **pulados** com o motivo
  explícito quando o Docker não tem `SwapLimit`, em vez de reprovar de forma
  intermitente.

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

## 5. Pendências entre issues

- Nenhuma: o socket do Docker e o `/tmp` compartilhado foram tratados na seção 7.

## 6. Vetores específicos da toolchain Verilog (RNF04-I03)

Recursos legítimos da linguagem que, num ambiente que executa código de
terceiros, tocam o sistema de arquivos ou o sistema operacional. Cada vetor foi
testado com um par design/testbench pelo fluxo real (`runInSandbox`).

| Vetor | Teste | Resultado observado | Impacto | Decisão |
| --- | --- | --- | --- | --- |
| `` `include "/etc/passwd" `` | include absoluto | lê o arquivo **da imagem** (o rootfs é a imagem, não o host); o conteúdo não chega ao usuário (`syntax error` na 1ª linha) | baixo — só existe o que já está na imagem pública | **aviso** ao usuário (não bloqueia) |
| `$readmemh("/etc/passwd", …)` | leitura em tempo de simulação | `Invalid input character: r` — vaza o 1º caractere de um arquivo da imagem | baixo | **aviso** |
| `$fopen("/etc/passwd","r")` + `$fgets` + `$display` | despejar arquivo | imprime `root:x:0:0:root:/root:/bin/sh` — arquivo da imagem; `/proc/self/environ` só tem `HOSTNAME` (sem `DATABASE_URL` etc.) | baixo — nenhum dado do host nem da API | risco aceito; ver seção 2 (ambiente limpo) |
| `$fopen("/etc/pwn","w")`, `/usr`, `/`, `/work/../` | gravar fora do workdir | `fd = 0` (falhou) nos quatro | nenhum | barreira: `ReadonlyRootfs`; **aviso** |
| `$dumpfile("/etc/x.vcd")`, `"../x.vcd"` | VCD fora do workdir | `VCD Error … Unable to open` → `runtime_error`, sem VCD | nenhum | barreira; **aviso** |
| `$system("…")` | executar comando | **não definido** nesta build (`System task/function $system() is not defined by any module`) | nenhum — não há execução de comando por Verilog | **aviso** (a linha vai falhar) |
| Macro recursiva | bomba de compilação | antes: `compile_error` por OOM (ou preso até o `killTimer`); agora interrompida em `SANDBOX_COMPILE_TIMEOUT_MS` (5 s), exit 4 | médio (ocupava o slot do worker) | resolvido em RNF05-I01 |
| `` `include `` circular | recursão de arquivos | antes: ~23,8 s até o `killTimer` do host; agora a recursão para no limite de descritores (`ulimit -n 64`): `Include file tb.v not found`, em segundos | médio | resolvido como efeito do limite de descritores (RNF04-I03) |
| `$fwrite` / `$dumpvars` em laço | **inundação de disco** do workdir (bind no host, sem cota) | 75 MB em 10,6 s **sem teto** (na máquina de desenvolvimento, por 9p; num SSD da VM, muito mais) | **alto** — `PidsLimit`/memória/CPU não cobrem disco | **corrigido**: `ulimit -f` = 16 MiB por arquivo (exit 153 → `runtime_error` com mensagem própria) e `ulimit -n 64` |
| `$display` em laço | **inundação do log** do container (json-file no host, sem teto) | `container.logs()` do `docker-modem` estourou com `ERR_STRING_TOO_LONG` (>512 MB em 10 s) — derrubava o job inteiro sem resultado | **alto** | **corrigido**: `LogConfig` `max-size 1m` × `max-file 2` (sobram sempre as últimas linhas, que é o que `truncateFromEnd` mantém) |

Antes → depois dos dois vetores de inundação:

| | Antes | Depois |
| --- | --- | --- |
| `$fwrite` em laço | 75 MB+ em 10,6 s, sem limite | para em **16.777.216 bytes** em 3,7 s, exit 153 |
| `$dumpvars` em laço | sem limite | para em 16 MiB em 3,6 s, exit 153; o VCD parcial ainda chega cortado a 2 MiB |
| `$display` em laço | job falha com `ERR_STRING_TOO_LONG` | log de 1,2 MB, resultado normal (`timeout`, últimas linhas preservadas) |

**Limite da mitigação de disco**: `RLIMIT_FSIZE` é **por arquivo**, e
`ulimit -n 64` limita quantos um testbench mantém abertos: no pior caso, alguns
arquivos de 16 MiB por job (≪ GB), contido pelo tempo (10 s) e pela concorrência
(2). Uma cota de verdade exigiria XFS com `pquota` (`StorageOpt size`) ou trocar o
workdir por um volume com tamanho fixo — fica registrado como evolução se o disco
da VM virar preocupação (RNF05-I02 mede o consumo real).

### Avisos ao usuário (`vectors.ts`)

Caminho absoluto ou com `..` em `` `include ``, `$readmemh/$readmemb`, `$fopen`,
`$dumpfile`, e `$system`, viram **`warning` com a linha** no console (o contrato
`DiagnosticSchema` de RF05), nunca bloqueio: `$readmemh` é a forma normal de
carregar memória em exercícios de sistemas digitais, e o impacto sob as barreiras
é baixo. Comentários não geram aviso e não deslocam a numeração.

### Permissão do workdir (passo 5 da issue)

`mkdtemp` cria o diretório com modo 0700 e dono = quem roda o worker; quem lê os
fontes e grava o `.vcd` dentro do container é o uid **10001** (`sandbox`).
`prepareWorkdir` (em `sandbox.ts`) troca o dono para 10001 e usa 0755 quando o
worker tem privilégio (container como root — o caso da VM), e cai para 0777 quando
não tem (desenvolvimento fora de container). Sem isso o worker de produção não
entregaria os fontes ao sandbox. Na máquina de desenvolvimento (Windows, bind por
9p) a permissão não é observável; a verificação real numa VM/worker Linux é feita
em RNF04-I02 (worker containerizado). `readVcd` passou a ler só arquivo regular
(`lstat`), para que um link simbólico no workdir nunca faça o worker ler um
arquivo do host no lugar do VCD (o Verilog não cria links — sem `$system` —, mas
custa uma linha garantir).

## 7. Exposição do socket do Docker (RNF04-I02)

**O problema.** O worker montava `/var/run/docker.sock` para criar os containers de
simulação. Acesso ao socket equivale a `root` no host: uma vulnerabilidade em
qualquer dependência do processo Node do worker viraria comprometimento total da VM.
O isolamento das seções anteriores protege contra o **código do usuário**, não contra
uma falha no próprio worker. O compose também montava o `/tmp` do host no worker.

**Alternativas avaliadas** (critério: o worker comprometido não pode virar `root` no host):

| Alternativa | Avaliação |
| --- | --- |
| Proxy genérico de socket (`tecnativa/docker-socket-proxy`) | **Ganho nulo aqui.** Filtra por *rota*: liberar `POST /containers/create` libera qualquer *corpo* — `Privileged: true`, `Binds: ["/:/host"]`. É o risco #2 da própria issue ("proxy mal configurado dá falsa sensação de segurança"), e não há como configurá-lo para validar o corpo |
| Daemon _rootless_ | Elimina o `root` do host, mas complica o bind de volumes e o desempenho; troca de plataforma de execução inteira para um requisito de M/G |
| Manter o socket e documentar | Risco aceito sem compensação — a maior dívida de segurança do projeto continuaria aberta |
| **Proxy validador próprio** (escolhido) | `infra/docker-proxy/` — ~250 linhas, só `node:http`, sem dependências. Valida rota **e** corpo |

**A decisão.** O único serviço com acesso ao socket passa a ser o `docker-proxy`
(imagem `node:22-alpine` com o código montado somente leitura, `read_only`,
`cap_drop: ALL`, `no-new-privileges`, **sem porta publicada** — só o worker, pela rede
do compose, alcança `:2375`). O worker fala com ele por `DOCKER_HOST=tcp://docker-proxy:2375`
(configurável em `env.ts`, validado) e **não monta mais o socket nem o `/tmp`**.

O que o proxy permite (levantado do que `runInSandbox` e a varredura de órfãos
realmente chamam) e o que recusa:

| Permitido | Condição |
| --- | --- |
| `POST /containers/create` | corpo **idêntico** às opções de `buildSandboxContainerOptions`: imagem única, `User: sandbox`, rede desligada, `Binds` = exatamente um `hdl-sim-*` dentro de `SANDBOX_WORKDIR_ROOT` montado em `/work:rw`, `ReadonlyRootfs`, `Tmpfs` fixo, `CapDrop: [ALL]`, `no-new-privileges`, `LogConfig` rotacionado, `Memory`/`NanoCpus`/`PidsLimit` dentro de tetos e `MemorySwap = Memory`; **qualquer campo fora da lista é recusado** |
| `start`, `wait`, `kill` (só `KILL`), `logs`, `json`, `DELETE` (`force`/`v`) | só por **id hexadecimal** e só de container **com o rótulo `tplab.sandbox=true`** (o proxy inspeciona o rótulo no daemon) |
| `GET /containers/json` | só com `filters={"label":["tplab.sandbox=true"]}` |
| **Tudo o mais** — `exec`, `attach`, `update`, `commit`, `archive`, imagens, volumes, redes, `build`, `info`, `swarm`, `prune` | **recusado com 403** |

O `create` é encaminhado **sem query string** (o `dockerode` repete os campos do corpo
na query; o daemon só honra `name`/`platform` ali, ambos recusados): só o corpo
validado vale.

**Verificação** — de dentro da rede do compose, como o worker faria:

| Tentativa | Resultado |
| --- | --- |
| criar container privilegiado com bind da raiz do host | 403 (`campo nao permitido em HostConfig: Privileged`) |
| `create` com `Image: alpine` + `Cmd` + bind da raiz | 403 |
| mesmo corpo válido com `Binds: ["/etc:/work:rw"]` | 403 (`Binds so aceita um diretorio hdl-sim-*…`) |
| `NetworkMode: host`; `Entrypoint` sobrescrito | 403 / 403 |
| `start`, `kill`, `DELETE --force`, `logs`, `inspect`, `exec` no **postgres** | 403 nos cinco (`sem o rotulo tplab.sandbox=true`; `exec` nem é rota) |
| listar todos os containers; `GET /images/json`; `GET /info`; criar volume; `prune` | 403 nos cinco |
| ciclo legítimo: `create` → `start` → `wait` (exit 0) → `inspect` → `logs` → listar por rótulo → `DELETE` | 201 / 204 / 200 / 200 / 200 / 200 / 204 |
| **worker containerizado de ponta a ponta** (root, sem socket, falando com o proxy) rodando uma simulação real | `failure: null`, stdout e VCD corretos, container removido; `postgres` e `redis` intactos |

Testes automatizados (repetíveis, sem Docker): `pnpm test:infra` (90 casos: 40+
corpos de `create` que **devem** ser recusados, rotas permitidas e recusadas,
travessia de caminho) e `docker-proxy.test.ts` em `pnpm --filter @tplab/api test`, que
confere que a política aceita **exatamente** o que `buildSandboxContainerOptions`
monta — mudar as opções do container sem mudar a política falharia só depois do
deploy, e este teste antecipa isso. Os casos de shell da seção 2 não são refeitos
_pelo proxy_: a política proíbe `Entrypoint`/`Cmd` justamente para que ninguém rode
um shell por ele; o fluxo Verilog real foi refeito de ponta a ponta pelo worker
containerizado.

**Volume `/tmp`.** Substituído por um diretório dedicado (`SANDBOX_WORKDIR_ROOT`,
padrão `/var/lib/tplab/work`) montado no **mesmo caminho** no host e no worker (o
bind do container de simulação é resolvido pelo daemon, no host). O `/tmp` do host
deixa de ser visível ao worker; os fontes do usuário passam só por esse diretório, e
é o único caminho que o proxy aceita em `Binds`. `prepareWorkdir` (RNF04-I03) foi
verificado aqui num worker Linux de verdade: como `root`, troca o dono do diretório
para o uid 10001 (0755) e o sandbox lê os fontes e grava o VCD.

**O que ficou protegido e o que continua exposto.**

- Protegido: um worker comprometido **não** cria container privilegiado, não monta
  volume do host, não executa comando em outro container, não lê imagens, volumes ou
  redes, e não toca no `postgres`/`redis`. O que ele alcança é o que o sandbox já
  contém (container efêmero, sem rede, com limites).
- **Continua exposto**: (1) o próprio `docker-proxy` monta o socket — é o ponto que
  agora precisa ser correto, por isso é pequeno, sem dependências e coberto por 90
  casos; um bug em `policy.mjs`/`proxy.mjs` reabre o risco. (2) O worker comprometido
  ainda pode criar containers de simulação (dentro dos tetos: até 512 MiB, 2 CPUs) e
  esgotar recurso da VM — o mesmo que qualquer usuário anônimo já pode fazer pela API.
  (3) O worker roda como `root` **dentro do container dele** (precisa do `chown` do
  workdir), sem socket. (4) Vulnerabilidades do daemon/kernel estão fora do escopo do
  modelo de ameaça. Registrar como limitação conhecida no texto do TCC.

### Achados colaterais desta verificação

- **O compose nunca subia o worker.** `env.ts` exigia `DATABASE_URL` em produção para
  todo processo, e o worker do compose (`NODE_ENV=production`) não a recebe: morria no
  start com `Configuracao de ambiente invalida`. A checagem passou para o processo da
  API (`createProjectService`), onde o banco é usado; o worker não deve receber
  credenciais que não usa. Só apareceu porque esta issue subiu o worker containerizado
  pela primeira vez.
- **`docker info` sem `SwapLimit` não é visível ao worker** (o proxy recusa `GET /info`):
  o aviso da seção 4 passa a ser emitido **pelo proxy** no start, que é quem tem o socket.

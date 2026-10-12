# Como publicar o TPLab (RF01)

> Roteiro executável, do zero até a aplicação no ar.
> Alvo: **Azure for Students** — uma VM Linux com Docker para a API, o worker, o
> Postgres, o Redis e o sandbox, conforme `docs/PROJECT_CONTEXT.md` §2.6.
>
> Não é preciso saber Azure de antemão: cada passo traz o comando e o que ele
> faz. Comandos marcados com 💻 rodam **na sua máquina**; com ☁️ rodam **dentro
> da VM**, depois do `ssh`.
>
> O roteiro tem **duas trilhas**. A principal publica em HTTP, no IP da VM, e não
> exige domínio nenhum — é a que foi executada e verificada. Quando você tiver um
> domínio, a seção **11** migra para HTTPS sem refazer nada.

## O que você vai ter no fim

| Parte | Onde roda | Como fica acessível |
| --- | --- | --- |
| Frontend (SPA React) | arquivos estáticos | `http://<ip-da-vm>/` |
| API (Fastify) | container na VM | `http://<ip-da-vm>/api/...` e `/health` |
| Worker de simulação | container na VM | nenhuma porta: consome a fila |
| Postgres e Redis | containers na VM | **só** pela rede interna do Docker |
| Sandbox (`iverilog`) | container efêmero por execução | criado pelo worker, sem rede |

Tempo estimado na primeira vez: **1 a 2 horas**, a maior parte esperando build.

---

## 0. Antes de começar

Você precisa de:

- [ ] Conta **Azure for Students** ativa (crédito de ~US$ 100) — <https://azure.microsoft.com/pt-br/free/students/>
- [ ] `git` e um terminal na sua máquina. O `ssh` já vem no Windows 10/11.
- [ ] A **Azure CLI** (<https://learn.microsoft.com/cli/azure/install-azure-cli>).
      Tudo abaixo também pode ser feito pelo portal, clicando, mas o roteiro é
      em comando.

Domínio **não** é pré-requisito. Sem ele a aplicação fica em HTTP no IP; o
Let's Encrypt não emite certificado para IP puro, então HTTPS só entra na
seção 11.

### Instalar a CLI fora do disco padrão (opcional)

O instalador normal vai para `C:\Program Files` e pede elevação. Para deixá-la em
outro disco sem UAC, use a instalação administrativa do MSI, que só extrai os
arquivos:

```powershell
msiexec /a "<caminho-do-azure-cli.msi>" /qb TARGETDIR="D:\Tools\AzureCLI"
```

Depois acrescente `D:\Tools\AzureCLI\Microsoft SDKs\Azure\CLI2\wbin` ao `Path` do
usuário. O MSI está em <https://aka.ms/installazurecliwindowsx64>.

> Escolha um diretório que seu usuário possa criar. `D:\Program Files` costuma ter
> ACL restrita e o MSI falha com **erro 1303**.

Entre no Azure pelo terminal (💻):

```bash
az login
az account show --output table   # confirme que a assinatura certa está ativa
```

Em terminal sem navegador, use `az login --use-device-code`.

---

## 1. Descobrir onde a sua assinatura deixa criar

**Este passo não é opcional.** A assinatura Azure for Students tem uma política
que restringe as regiões, e criar a VM fora delas falha com
`RequestDisallowedByAzure`.

💻 Veja as regiões permitidas:

```bash
az policy assignment list --disable-scope-strict-match \
  --query "[?displayName=='Allowed resource deployment regions'].parameters.listOfAllowedLocations.value" \
  --output json
```

> Na assinatura usada neste TCC (tenant `pucminas.edu.br`) o resultado foi
> `northcentralus`, `mexicocentral`, `centralus`, `italynorth` e `chilecentral`.
> **`brazilsouth` não está na lista** — era o que este documento mandava usar
> antes de a publicação ser feita de verdade. Entre as permitidas,
> `chilecentral` é a mais próxima do Brasil (Santiago; ~40 ms de Belo Horizonte,
> contra ~140 ms das regiões dos EUA).

💻 E confirme que o tamanho de VM existe **com capacidade** na região escolhida:

```bash
az vm list-skus --location chilecentral --resource-type virtualMachines --all \
  --query "[?name=='Standard_B2s'||name=='Standard_B2as_v2'].{sku:name, restricoes:length(restrictions)}" \
  --output table
```

`restricoes` igual a `0` significa liberado. Qualquer valor maior significa que a
criação vai falhar com `SkuNotAvailable`.

> **`az vm list-sizes` não serve para isso**: ele lista o catálogo da região e
> mostra o `Standard_B2s` como se estivesse disponível. Quem revela a restrição
> real é o `az vm list-skus --all`, olhando `restrictions`.
>
> Na verificação de 2026-10-12, `Standard_B2s` estava restrito em `chilecentral` e
> em `mexicocentral`. A VM subiu com **`Standard_B2as_v2`** (2 vCPU, 8 GiB) — mais
> memória que o B2s (4 GiB) e folga confortável para dois jobs simultâneos no
> limite de `SANDBOX_MEMORY_MB` (ver `README.md`, "Dimensionamento dos limites").
> Em contrapartida custa cerca do dobro por hora: ver a seção 9 sobre desligar a
> VM entre as demonstrações.

---

## 2. Criar a VM

💻 Crie o grupo de recursos e a VM (ajuste região e tamanho ao que o passo 1
devolveu):

```bash
az group create --name tplab --location chilecentral

az vm create \
  --resource-group tplab \
  --name tplab-vm \
  --location chilecentral \
  --image Ubuntu2404 \
  --size Standard_B2as_v2 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --os-disk-size-gb 32 \
  --public-ip-sku Standard \
  --nsg-rule SSH
```

O comando imprime o `publicIpAddress` no fim. **Anote.**

> **Se o comando terminar com `ResourceNotFound` do `...VMNic`, não refaça nada
> ainda.** Essa região devolve esse erro ao buscar o IP logo depois de criar a
> VM, por atraso de replicação do ARM — a VM costuma estar criada. Confira antes
> de concluir que falhou:
>
> ```bash
> az resource list --resource-group tplab --output table
> az vm show --resource-group tplab --name tplab-vm --show-details \
>   --query "{estado:powerState, ip:publicIps}" --output table
> ```

💻 Libere a porta 80 (a 22 já veio pelo `--nsg-rule SSH`):

```bash
az vm open-port --resource-group tplab --name tplab-vm --port 80 --priority 900
```

> `az vm open-port` também falha de forma intermitente com `ResourceNotFound`
> nessa região, mesmo com as leituras funcionando. Confira o resultado e, se a
> regra não apareceu, tente de novo ou crie direto no NSG:
>
> ```bash
> az network nsg rule list --resource-group tplab --nsg-name tplab-vmNSG \
>   --query "[].{regra:name, porta:destinationPortRange}" --output table
> ```
>
> Persistindo, o portal (**Grupo de segurança de rede > Regras de entrada >
> Adicionar**) resolve em três cliques.

A 443 só é necessária na seção 11, quando houver domínio e TLS.

> **Nunca** abra 5432 (Postgres) nem 6379 (Redis). O compose de produção já não
> publica essas portas; deixá-las fechadas no firewall é a segunda barreira.

💻 Deixe o IP fixo, para ele não mudar quando a VM for desligada e religada:

```bash
az network public-ip update --resource-group tplab --name tplab-vmPublicIP --allocation-method Static
```

---

## 3. Preparar a VM

💻 Entre na VM:

```bash
ssh azureuser@<IP-da-VM>
```

☁️ Instale o Docker (script oficial) e deixe seu usuário usá-lo sem `sudo`:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit
```

Saia e entre de novo (o grupo só vale em uma sessão nova), e confirme:

```bash
ssh azureuser@<IP-da-VM>
docker run --rm hello-world
```

☁️ Crie o diretório de trabalho do sandbox — é por ele que os fontes de cada
simulação passam, e o worker e o daemon precisam enxergá-lo **no mesmo caminho**:

```bash
sudo mkdir -p /var/lib/tplab/work
sudo chown $USER:$USER /var/lib/tplab/work
```

☁️ Traga o código. `/opt` pertence ao root, então o diretório precisa ser criado e
cedido **antes** do clone, senão o `git clone` falha por permissão:

```bash
sudo mkdir -p /opt/tplab
sudo chown $USER:$USER /opt/tplab
git clone https://github.com/Tupacao/tcc-hdl-platform.git /opt/tplab
cd /opt/tplab
```

---

## 4. Construir as imagens do sandbox

A imagem do sandbox **não** é construída pelo compose: o worker a usa para criar
containers efêmeros, e ela precisa existir antes de o worker subir.

☁️ 

```bash
docker build -t tplab-sandbox:latest infra/sandbox
docker build -t tplab-sandbox-ghdl:latest infra/sandbox-ghdl   # VHDL (RNF08-I02), opcional
docker images | grep tplab-sandbox
```

---

## 5. Configurar os segredos

☁️ Copie o modelo e preencha:

```bash
cp infra/.env.example infra/.env
nano infra/.env
chmod 600 infra/.env
```

Gere os dois segredos com estes comandos e cole no arquivo:

```bash
openssl rand -base64 24   # POSTGRES_PASSWORD
openssl rand -hex 32      # FEEDBACK_IP_SALT
```

Preencha também, **na trilha sem domínio**:

- `TPLAB_DOMAIN` — o valor literal `:80`. No Caddy, um endereço de site que é só
  uma porta significa "escute HTTP nela, sem TLS". É o que evita o Caddy tentar
  emitir certificado para um IP e falhar em laço.
- `TPLAB_ACME_EMAIL` — seu e-mail. Com `:80` o ACME nunca é acionado, mas o
  compose exige a variável preenchida.
- `CORS_ORIGIN` — `http://<ip-da-vm>`. É a origem que a API aceita.
- `FRONTEND_DIST` — `/opt/tplab/web-dist` (descomente a linha). É o `dist` do
  frontend que o Caddy vai servir.

> `infra/.env` **nunca** entra no Git (`.gitignore` já cobre). Se precisar
> recriar a VM, você refaz este arquivo — anote os valores em um gerenciador de
> senhas, não no repositório.

---

## 6. Subir a stack

☁️ O diretório do frontend precisa existir antes, senão o Docker o cria como root
e o `scp` do passo 7 falha:

```bash
mkdir -p /opt/tplab/web-dist
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d --build
```

O primeiro build demora (compila `@tplab/shared` e a API dentro da imagem). Ao
fim, confira que os seis serviços estão de pé:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env ps
```

Esperado: `postgres`, `redis`, `api`, `worker`, `docker-proxy` e `caddy` em
`running` (postgres e redis com `healthy`).

As migrações do banco rodam sozinhas: o serviço `api` executa
`prisma migrate deploy` antes de iniciar (o `worker` não, para não migrar duas
vezes). Para conferir:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs api | head -30
```

---

## 7. Publicar o frontend

O frontend é um conjunto de arquivos estáticos. Há dois caminhos — **escolha um**.

### Opção A — servido pela própria VM (é a desta trilha)

💻 Na sua máquina, gere o `dist`. **Deixe `VITE_API_URL` vazio**: como o mesmo
Caddy serve o frontend e encaminha `/api`, tudo é mesma origem, o caminho
relativo funciona (`apps/web/src/lib/api.ts` usa `?? ''`) e **não existe CORS
para dar errado**. O `apps/web/.env.example` já vem assim.

```bash
pnpm --filter @tplab/web build
```

💻 Envie o **conteúdo** do `dist` para o diretório criado no passo 6 (a barra e o
`*` importam: `scp -r dist destino` criaria `destino/dist`):

```bash
scp -r apps/web/dist/* azureuser@<IP-da-VM>:/opt/tplab/web-dist/
```

☁️ O Caddy já está apontado para lá pelo `FRONTEND_DIST`. Se você acabou de
acrescentar a variável ao `.env`, recarregue:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d caddy
```

### Opção B — Azure Static Web Apps (tier Free, tira o tráfego estático da VM)

💻 

```bash
az staticwebapp create --name tplab-web --resource-group tplab --location eastus2
az staticwebapp environment list --name tplab-web --output table   # mostra a URL gerada
```

Aqui o frontend fica em **outra origem**, então o caminho relativo não serve:
gere o `dist` com `VITE_API_URL=http://<ip-da-vm>` e **acrescente a URL do SWA em
`CORS_ORIGIN`** (separada por vírgula), reiniciando a API depois:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d api
```

> Navegador moderno bloqueia página HTTPS que chama API em HTTP (conteúdo misto).
> Na prática a opção B só fecha depois da seção 11.

---

## 8. Verificar

💻 Da sua máquina:

```bash
curl -i http://<ip-da-vm>/health
```

Esperado: `HTTP/1.1 200` e um corpo JSON com o status da API.

Depois, no navegador, o roteiro de aceite de RF01:

- [ ] A página abre em `http://<ip-da-vm>/`.
- [ ] Escrever/alterar o circuito, clicar em **Executar** e ver a saída no Console.
- [ ] Ver a forma de onda do exemplo.
- [ ] Forçar um erro de sintaxe e conferir que o erro aparece em **Problemas** e
      leva à linha ao ser clicado.
- [ ] Criar e renomear um projeto.
- [ ] Enviar um feedback (RF17) e conferir que ele chegou (seção abaixo).

Se a simulação ficar presa em "Na fila", o worker é o suspeito:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs worker --tail=50
```

---

## 9. Operação do dia a dia

### Atualizar para a versão mais recente

☁️ 

```bash
cd /opt/tplab
git pull
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d --build
```

Mudou algo em `infra/sandbox/`? Reconstrua a imagem do sandbox (passo 4) **antes**.
Mudou o frontend? Refaça o passo 7 (build + `scp`) — o `dist` não vem pelo
`git pull`.

### Ver os logs

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs -f api
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs -f worker
```

O worker emite uma linha estruturada por job (RF03-I04): duração, desfecho,
tempos parciais e tamanhos — nunca o código do aluno.

### Ler os feedbacks (RF17)

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env exec postgres \
  psql -U tplab -d tplab -c 'SELECT "createdAt", kind, message, contact FROM "Feedback" ORDER BY "createdAt" DESC LIMIT 50;'
```

Mais consultas (filtrar por tipo, exportar CSV) no `README.md`.

### Backup do banco

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env exec postgres \
  pg_dump -U tplab tplab > ~/tplab-$(date +%F).sql
```

Traga o arquivo para fora da VM (`scp`) — backup que só existe na máquina que
pode morrer não é backup.

### Economizar crédito entre as demonstrações

A VM só gasta compute enquanto está ligada. O que para a cobrança é **desalocar**,
não dar `shutdown` por dentro: desligada por dentro, a VM continua com o hardware
reservado e **continua sendo cobrada**.

Desalocada, sobra apenas o custo do disco e do IP (~US$ 2/mês). Um
`Standard_B2as_v2` ligado o mês inteiro consome por volta de US$ 55-60 do crédito
de US$ 100 — ou seja, deixar ligado sem necessidade gasta o crédito do TCC em
cerca de sete semanas.

Os dados sobrevivem: ficam nos volumes do Docker, no disco da VM. Ao religar, os
containers voltam sozinhos (`restart: unless-stopped`) e o IP é o mesmo, porque
foi fixado como `Static` no passo 2.

**Pelo terminal:**

```bash
az vm deallocate --resource-group tplab --name tplab-vm   # para de gastar compute
az vm start --resource-group tplab --name tplab-vm        # volta, com o mesmo IP
az vm show --resource-group tplab --name tplab-vm --show-details \
  --query "{estado:powerState, ip:publicIps}" --output table
```

**Pelo portal (<https://portal.azure.com>):**

1. Na busca do topo, digite `tplab-vm` e clique na máquina virtual que aparece
   (ou vá em **Máquinas virtuais** no menu lateral e escolha `tplab-vm`).
2. Na barra de botões do topo da página da VM, clique em **Parar**
   (ícone de quadrado; em inglês, **Stop**).
3. Confirme no painel que abre. **É esse botão que desaloca** — o portal não
   oferece um "desligar sem desalocar", então aqui não há risco de continuar
   pagando por engano.
4. Espere o campo **Status** virar **Parado (desalocado)** / *Stopped
   (deallocated)*. Só nesse estado o compute deixa de ser cobrado; **Parado**
   sozinho ainda cobra.
5. Para religar, mesmo lugar: botão **Iniciar** / **Start**. A aplicação volta ao
   ar sozinha em um ou dois minutos, no mesmo IP.

> Para acompanhar o consumo: **Gerenciamento de Custos + Cobrança > Análise de
> custo**, filtrando pelo grupo de recursos `tplab`. Os valores levam até 24 h
> para aparecer.

---

## 10. Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| `RequestDisallowedByAzure` ao criar a VM | Região fora da política da assinatura | Refaça o passo 1 e escolha uma região permitida |
| `SkuNotAvailable` ao criar a VM | Tamanho sem capacidade naquela região | `az vm list-skus --all` (passo 1) e escolha outro tamanho |
| `ResourceNotFound` do NIC/NSG com tudo existindo | Atraso de replicação do ARM na região | Confira com `az resource list`; repita a operação de escrita |
| `curl: (7) Failed to connect` na 80 | Porta fechada no firewall do Azure | Refaça o `az vm open-port` do passo 2 |
| Caddy em laço tentando emitir certificado | `TPLAB_DOMAIN` com IP ou domínio que não aponta para a VM | Na trilha sem domínio, `TPLAB_DOMAIN=:80` |
| Tela carrega, mas toda ação falha com erro de rede | `CORS_ORIGIN` diferente da origem real do frontend | Corrija em `infra/.env` e `up -d api` |
| `POST /api/simulations` responde 503 | Redis fora do ar, ou fila cheia | `logs redis`; se estiver de pé, a fila encheu — espere ou aumente `SIMULATION_MAX_QUEUE_DEPTH` |
| Simulação fica em "Na fila" para sempre | Worker parado, ou imagem do sandbox ausente | `logs worker`; confira `docker images \| grep tplab-sandbox` |
| Worker loga "Docker sem limite de swap" | Kernel sem contabilidade de swap | O limite de memória não protege a VM (RNF05); ver `docs/SEGURANCA.md` |
| `api` reinicia em laço no primeiro start | `DATABASE_URL`/senha errada no `.env` | `logs api`; corrija `infra/.env` e `up -d api` |
| Disco cheio | Imagens e builds antigos acumulados | `docker system prune -a` (não remove volumes com os dados) |

---

## 11. Quando você tiver o domínio: migrar para HTTPS

Nada do que já está no ar é refeito. São cinco passos, e a aplicação fica fora do
ar só durante o reinício do Caddy (segundos).

### 11.1 Apontar o domínio para a VM

No painel de quem registrou seu domínio, crie um registro **A**:

| Tipo | Nome | Valor | TTL |
| --- | --- | --- | --- |
| A | `tplab` (ou `@` para o domínio raiz) | o IP estático da VM | o menor oferecido |

Confira a propagação (💻, pode levar de minutos a algumas horas):

```bash
nslookup tplab.seu-dominio.br
```

**Só siga quando esse comando devolver o IP da VM.** Pedir certificado antes
disso gasta tentativas do limite do Let's Encrypt e o Caddy entra em laço de
reemissão.

### 11.2 Abrir a porta 443

💻 

```bash
az vm open-port --resource-group tplab --name tplab-vm --port 443 --priority 901
az network nsg rule list --resource-group tplab --nsg-name tplab-vmNSG \
  --query "[].{regra:name, porta:destinationPortRange}" --output table
```

Confira que a regra apareceu — essa chamada é uma das que falham de forma
intermitente (ver passo 2). Pelo portal: **tplab-vmNSG > Regras de segurança de
entrada > Adicionar**, porta de destino `443`, protocolo TCP, ação `Permitir`,
prioridade `901`.

### 11.3 Trocar o domínio e a origem no `.env`

☁️ Em `/opt/tplab/infra/.env`, três linhas mudam:

```bash
TPLAB_DOMAIN=tplab.seu-dominio.br     # era :80 — sem https://, sem barra no fim
TPLAB_ACME_EMAIL=voce@exemplo.br      # recebe os avisos de expiração do certificado
CORS_ORIGIN=https://tplab.seu-dominio.br
```

### 11.4 Recarregar o Caddy

☁️ 

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d caddy api
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs -f caddy
```

Acompanhe o log até ver a emissão do certificado concluir (`certificate obtained
successfully`). Leva de alguns segundos a um ou dois minutos.

### 11.5 Refazer o frontend e verificar

Na opção A (Caddy servindo o `dist`), `VITE_API_URL` continua vazio e o `dist`
que já está na VM continua valendo — o caminho relativo `/api` passa a ser HTTPS
junto com a página, sem rebuild. Ainda assim, refazer build e `scp` é o caminho
seguro se você tiver mexido no frontend desde a publicação.

💻 Verifique:

```bash
curl -i https://tplab.seu-dominio.br/health
```

Esperado: `HTTP/2 200` e certificado válido — **sem** precisar de `--insecure`.

No navegador, confira o cadeado e repita o roteiro de aceite da seção 8, agora em
`https://`. O Caddy redireciona `http://` para `https://` sozinho, e o cabeçalho
`Strict-Transport-Security` do `infra/caddy/Caddyfile` passa a valer de fato
(em HTTP puro o navegador o ignora).

> Depois da migração, atualize o `README.md` com a URL pública — é um dos
> critérios de aceite de RF01-I03.

---

## O que este roteiro ainda não cobre

Registrado aqui para não parecer esquecimento:

- **Deploy automático** (GitHub Actions publicando na VM): hoje a atualização é
  manual, pelo `git pull` do passo 9.
- **Alta disponibilidade e autoescala**: uma VM só, fora do escopo (RF01 §6).
- **Backup automático** do Postgres: o comando existe, o agendamento não.
- **Verificação em máquina limpa** (RF01-I03): a publicação foi verificada da
  máquina de desenvolvimento, mas o roteiro em máquina sem Node/Docker, com as
  capturas de tela, ainda precisa ser executado e registrado em
  `docs/requisitos/funcional/RF01/`.

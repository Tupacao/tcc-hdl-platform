# Como publicar o TPLab (RF01)

> Roteiro executável, do zero até a aplicação no ar em `https://<seu-domínio>`.
> Alvo: **Azure for Students** — uma VM Linux com Docker para a API, o worker, o
> Postgres, o Redis e o sandbox, conforme `docs/PROJECT_CONTEXT.md` §2.6.
>
> Não é preciso saber Azure de antemão: cada passo traz o comando e o que ele
> faz. Comandos marcados com 💻 rodam **na sua máquina**; com ☁️ rodam **dentro
> da VM**, depois do `ssh`.

## O que você vai ter no fim

| Parte | Onde roda | Como fica acessível |
| --- | --- | --- |
| Frontend (SPA React) | arquivos estáticos | `https://<domínio>/` |
| API (Fastify) | container na VM | `https://<domínio>/api/...` e `/health` |
| Worker de simulação | container na VM | nenhuma porta: consome a fila |
| Postgres e Redis | containers na VM | **só** pela rede interna do Docker |
| Sandbox (`iverilog`) | container efêmero por execução | criado pelo worker, sem rede |

Tempo estimado na primeira vez: **1 a 2 horas**, a maior parte esperando build
e propagação de DNS.

---

## 0. Antes de começar

Você precisa de:

- [ ] Conta **Azure for Students** ativa (crédito de ~US$ 100) — <https://azure.microsoft.com/pt-br/free/students/>
- [ ] Um **domínio** (ou subdomínio) que você possa apontar para um IP. Sem
      domínio não há certificado: o Let's Encrypt não emite para IP puro.
- [ ] `git` e um terminal na sua máquina. O `ssh` já vem no Windows 10/11.
- [ ] Opcional, mas recomendado: a **Azure CLI**
      (<https://learn.microsoft.com/cli/azure/install-azure-cli>). Tudo abaixo
      também pode ser feito pelo portal, clicando.

Entre no Azure pelo terminal (💻):

```bash
az login
az account show --output table   # confirme que a assinatura certa está ativa
```

---

## 1. Criar a VM

Uma `Standard_B2s` (2 vCPU, 4 GiB) dá conta de dois jobs simultâneos no limite
de `SANDBOX_MEMORY_MB` (ver `README.md`, "Dimensionamento dos limites").

💻 Crie o grupo de recursos e a VM:

```bash
az group create --name tplab --location brazilsouth

az vm create \
  --resource-group tplab \
  --name tplab-vm \
  --image Ubuntu2404 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --os-disk-size-gb 32 \
  --public-ip-sku Standard
```

O comando imprime o `publicIpAddress` no fim. **Anote.**

💻 Libere as portas 80 e 443 (o `ssh`/22 já vem aberto):

```bash
az vm open-port --resource-group tplab --name tplab-vm --port 80 --priority 900
az vm open-port --resource-group tplab --name tplab-vm --port 443 --priority 901
```

> **Nunca** abra 5432 (Postgres) nem 6379 (Redis). O compose de produção já não
> publica essas portas; deixá-las fechadas no firewall é a segunda barreira.

💻 Deixe o IP fixo, para o DNS não quebrar quando a VM reiniciar:

```bash
az network public-ip update --resource-group tplab --name tplab-vmPublicIP --allocation-method Static
```

---

## 2. Apontar o domínio

No painel de quem registrou seu domínio, crie um registro **A**:

| Tipo | Nome | Valor |
| --- | --- | --- |
| A | `tplab` (ou `@` para o domínio raiz) | o `publicIpAddress` do passo 1 |

Confira a propagação (💻, pode levar de minutos a algumas horas):

```bash
nslookup tplab.seu-dominio.br
```

Só siga para o passo 6 (TLS) quando esse comando devolver o IP da VM. Os passos
3 a 5 podem ser feitos enquanto o DNS propaga.

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

☁️ Traga o código:

```bash
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
```

Gere os dois segredos com estes comandos e cole no arquivo:

```bash
openssl rand -base64 24                                                  # POSTGRES_PASSWORD
docker run --rm node:22-alpine node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # FEEDBACK_IP_SALT
```

Preencha também:

- `TPLAB_DOMAIN` — o domínio do passo 2, **sem** `https://`.
- `TPLAB_ACME_EMAIL` — seu e-mail (avisos de expiração do certificado).
- `CORS_ORIGIN` — `https://<seu-domínio>`. É a origem que a API aceita; errar
  aqui faz o navegador bloquear toda chamada, com erro de CORS no console.

> `infra/.env` **nunca** entra no Git (`.gitignore` já cobre). Se precisar
> recriar a VM, você refaz este arquivo — anote os valores em um gerenciador de
> senhas, não no repositório.

---

## 6. Subir a stack

☁️ 

```bash
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

### Opção A — servido pela própria VM (mais simples)

💻 Na sua máquina, gere o `dist` apontando para a API pública:

```bash
cd apps/web
echo "VITE_API_URL=https://tplab.seu-dominio.br" > .env.production
cd ../..
pnpm --filter @tplab/web build
```

💻 Envie para a VM:

```bash
scp -r apps/web/dist azureuser@<IP-da-VM>:/opt/tplab/web-dist
```

☁️ Aponte o Caddy para ele e recarregue:

```bash
echo "FRONTEND_DIST=/opt/tplab/web-dist" >> infra/.env
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d caddy
```

### Opção B — Azure Static Web Apps (tier Free, tira o tráfego estático da VM)

💻 

```bash
az staticwebapp create --name tplab-web --resource-group tplab --location eastus2
az staticwebapp environment list --name tplab-web --output table   # mostra a URL gerada
```

Gere o `dist` com `VITE_API_URL=https://tplab.seu-dominio.br` (como na opção A),
publique-o com a CLI do SWA e **acrescente a URL do SWA em `CORS_ORIGIN`**
(separada por vírgula), reiniciando a API depois:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d api
```

---

## 8. Verificar

💻 Da sua máquina:

```bash
curl -i https://tplab.seu-dominio.br/health
```

Esperado: `HTTP/2 200`, certificado válido (sem `--insecure`) e um corpo JSON
com o status da API.

Depois, no navegador, o roteiro de aceite de RF01:

- [ ] A página abre em `https://<domínio>/` sem aviso de certificado.
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

A VM só gasta enquanto está ligada. Desligue **pelo Azure** (desalocar), não com
`shutdown` de dentro, ou ela continua sendo cobrada:

```bash
az vm deallocate --resource-group tplab --name tplab-vm   # para de gastar compute
az vm start --resource-group tplab --name tplab-vm        # volta, com o mesmo IP estático
```

Os dados sobrevivem: ficam nos volumes do Docker, no disco da VM. Os containers
voltam sozinhos (`restart: unless-stopped`).

---

## 10. Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| Aviso de certificado no navegador | DNS ainda não propagou quando o Caddy tentou emitir | Confirme `nslookup`; depois `docker compose ... restart caddy` |
| `curl: (7) Failed to connect` na 443 | Porta fechada no firewall do Azure | Refaça o `az vm open-port` do passo 1 |
| Tela carrega, mas toda ação falha com erro de rede | `CORS_ORIGIN` diferente da origem real do frontend | Corrija em `infra/.env` e `up -d api` |
| `POST /api/simulations` responde 503 | Redis fora do ar, ou fila cheia | `logs redis`; se estiver de pé, a fila encheu — espere ou aumente `SIMULATION_MAX_QUEUE_DEPTH` |
| Simulação fica em "Na fila" para sempre | Worker parado, ou imagem do sandbox ausente | `logs worker`; confira `docker images \| grep tplab-sandbox` |
| Worker loga "Docker sem limite de swap" | Kernel sem contabilidade de swap | O limite de memória não protege a VM (RNF05); ver `docs/SEGURANCA.md` |
| `api` reinicia em laço no primeiro start | `DATABASE_URL`/senha errada no `.env` | `logs api`; corrija `infra/.env` e `up -d api` |
| Disco cheio | Imagens e builds antigos acumulados | `docker system prune -a` (não remove volumes com os dados) |

---

## O que este roteiro ainda não cobre

Registrado aqui para não parecer esquecimento:

- **Deploy automático** (GitHub Actions publicando na VM): hoje a atualização é
  manual, pelo `git pull` do passo 9.
- **Alta disponibilidade e autoescala**: uma VM só, fora do escopo (RF01 §6).
- **Backup automático** do Postgres: o comando existe, o agendamento não.
- **Verificação em máquina limpa** (RF01-I03): precisa ser executada e registrada
  em `docs/requisitos/funcional/RF01/` depois da primeira publicação.

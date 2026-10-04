# TPLab

Plataforma web educacional para desenvolvimento e simulacao de circuitos digitais
em HDL. Escrever Verilog, compilar, simular e ver as formas de onda acontece
inteiramente no navegador, sem instalacao local (RF01), em uma unica interface
(RF09). O publico-alvo sao estudantes que estao tendo o primeiro contato com
descricao de hardware.

Trabalho de Conclusao de Curso. Os requisitos completos estao em
[`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).

## Stack

| Camada       | Tecnologias                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Frontend     | React 19 + Vite + TypeScript, Tailwind CSS v4, shadcn/ui, Monaco Editor, react-resizable-panels, sonner |
| Backend      | Node.js + Fastify + TypeScript, Zod (`fastify-type-provider-zod`), BullMQ + Redis                       |
| Execucao HDL | Icarus Verilog (`iverilog` + `vvp`) em container Docker efemero, via dockerode                          |
| Dados        | PostgreSQL, Redis                                                                                       |

## Estrutura

```
apps/
  web/      Frontend React + Vite            (@tplab/web)
  api/      API Fastify + worker da fila     (@tplab/api)
packages/
  shared/   Schemas Zod e tipos compartilhados (@tplab/shared)
infra/
  docker-compose.yml   Postgres, Redis, api, worker
  sandbox/             Imagem Docker do sandbox de execucao (iverilog)
docs/
```

## Requisitos

- Node.js >= 22
- pnpm >= 10 (`npm i -g pnpm`)
- Docker (Postgres, Redis e o sandbox de execucao)

## Como rodar

```bash
git clone https://github.com/Tupacao/tcc-hdl-platform.git
cd tcc-hdl-platform
pnpm install

# 1. Infraestrutura (Postgres + Redis)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 2. Imagem do sandbox de simulacao
pnpm sandbox:build

# 3. Variaveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Migracoes do Prisma (projetos persistidos em Postgres — RF07)
pnpm --filter @tplab/api exec prisma migrate dev

# 5. Aplicacoes (web + api em paralelo)
pnpm dev

# 6. Worker de simulacao, em outro terminal
pnpm dev:worker
```

A API lê `apps/api/.env` sozinha, no start (`loadDotEnv` em
`apps/api/src/config/env.ts`) — variável já exportada no shell tem precedência
sobre o arquivo. Se o seu `.env` é antigo, vale recopiá-lo do `.env.example`: uma
variável que falta ali não dá erro, só muda o comportamento em silêncio (sem
`DATABASE_URL` cai para memória; sem `FEEDBACK_IP_SALT` o limite diário de
feedback zera a cada reinício).

Sem `DATABASE_URL` (ou sem rodar a migracao) a API ainda sobe, mas os projetos
ficam em memoria e somem a cada reinicio — util para desenvolvimento rapido sem
Postgres, nao para uso real. Em producao (`NODE_ENV=production`) a variavel e
obrigatoria e a API nao inicia sem ela.

- Frontend: http://localhost:5173
- API: http://localhost:3333 (`GET /health`)

O Vite faz proxy de `/api` para a API, entao nao ha CORS no desenvolvimento.

## Scripts

| Comando                                               | Descricao                                                 |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                                            | Compila `@tplab/shared` e sobe web + api                  |
| `pnpm dev:worker`                                     | Worker que consome a fila e executa o sandbox             |
| `pnpm build`                                          | Build de todos os pacotes                                 |
| `pnpm typecheck`                                      | Verificacao de tipos em todo o monorepo                   |
| `pnpm --filter @tplab/api test`                       | Testes (parser de diagnosticos e repositorio de projetos) |
| `pnpm infra:up` / `pnpm infra:down`                   | Stack Docker completa                                     |
| `pnpm sandbox:build`                                  | Constroi a imagem `tplab-sandbox:latest`                  |
| `pnpm --filter @tplab/api test:sandbox`               | Auditoria do sandbox contra o Docker real (RNF04/RNF05)   |
| `pnpm --filter @tplab/api measure:sandbox`            | Mede limites e desempenho do sandbox (RNF05-I02)          |
| `pnpm --filter @tplab/api measure:e2e`                | Mede o tempo ponta a ponta por etapa (RNF07-I01)          |
| `pnpm test:infra`                                     | Testes da política do proxy do socket do Docker (RNF04)   |
| `pnpm --filter @tplab/api exec prisma migrate dev`    | Cria/aplica migracao a partir do schema (dev)             |
| `pnpm --filter @tplab/api exec prisma migrate deploy` | Aplica migracoes pendentes (producao/CI)                  |

## Fluxo de uma simulacao

1. O frontend envia `POST /api/simulations` com o design e o testbench, validados
   pelo `CompileRequestSchema` de `packages/shared`.
2. A API enfileira o job no BullMQ e responde `202` com o `jobId`.
3. O worker cria um container efemero (`--network=none`, 128 MB, 0.5 CPU, rootfs
   somente leitura, 5 s de compilação e 10 s de simulação) que roda `iverilog` e `vvp`
   (RNF04/RNF05; valores e medições em "Dimensionamento dos limites").
4. A saida do `iverilog` e convertida em diagnosticos com numero de linha (RF05) e
   o `.vcd` gerado volta para o visualizador de formas de onda (RF06).
5. O frontend acompanha o job por polling em `GET /api/simulations/:jobId`.

> Codigo submetido pelo usuario **nunca** e executado no processo da API — sempre
> pelo caminho `runInSandbox`.

## Observabilidade do pipeline (RF03-I04)

API e worker logam em JSON estruturado (pino), pela mesma instancia
(`apps/api/src/lib/logger.ts`). Cada job concluido gera uma linha no worker
com `jobId`, `durationMs`, `failure`, `exitCode`, `vcdBytes`, `sourceBytes`,
`queueWaitMs` (tempo entre enfileirar e um worker pegar o job) e `timings`
(`containerCreateMs`/`executionMs`/`artifactsReadMs` — os tres somados ficam
perto de `durationMs`; a diferenca e escrita dos fontes no tmpdir e limpeza do
container/workdir). **Nunca** inclui o texto do `.vcd`/`stdout`/`stderr` nem o
codigo submetido, so tamanhos.

`GET /health/metrics` devolve o agregado desde o ultimo restart do Redis (os
contadores nao sao uma serie historica — zeram em `FLUSHALL` ou reinicio do
container):

```json
{
  "totalJobs": 12,
  "succeededJobs": 10,
  "failedJobs": 2,
  "failuresByType": { "compile_error": 1, "timeout": 1 },
  "averageDurationMs": 2148.5
}
```

Para o capitulo de resultados do TCC (evidencia de RNF07 — "menos de cinco
segundos"): rodar uma bateria de simulacoes representativas, depois `curl -s
http://localhost:3333/health/metrics` para o agregado, e `grep` na saida do
worker (`pnpm dev:worker`, ou `docker compose logs worker` em producao) pelas
linhas `"msg":"job de simulacao concluido"` para o detalhe por job — inclusive
os tempos parciais, uteis para separar overhead do Docker (RNF07-I02) do tempo
de `iverilog`/`vvp` propriamente dito.

## Contrato do testbench (RF04-I01)

A plataforma nunca gera estimulo nem infere clock — **o testbench e do usuario**
por decisao deliberada (escrever testbench faz parte do que a disciplina
ensina). Isso funciona bem quando o testbench instancia o design certo e pede
a gravacao da forma de onda; falha de formas confusas quando nao. Antes de
gastar um container, `application/simulation/service/testbench.ts` roda uma analise
heuristica (regex, nunca bloqueia) e devolve tres avisos possiveis, sempre
como diagnostico `warning` no mesmo console dos erros do `iverilog`:

1. O arquivo de design nao declara `module <topModule>`.
2. O testbench nao instancia `<topModule>` (aceita parametrizacao e quebra de
   linha; ignora mencoes dentro de comentario).
3. O testbench nao chama `$dumpfile(...)` e `$dumpvars(...)` — sem isso nenhuma
   forma de onda e gerada, mesmo com a simulacao rodando sem erro.

Depois da execucao, se a simulacao terminou sem erro mas sem `.vcd`, um quarto
aviso complementa: se tambem nao houve `stdout`, o testbench provavelmente nao
instanciou nada; se houve `stdout` mas nenhum aviso estatico de `$dumpvars` foi
emitido, sugere conferir o escopo passado a `$dumpvars`.

Contrato minimo esperado de um testbench, para nao disparar nenhum aviso:

```verilog
module meu_circuito_tb;
    // ... declaracoes e instanciacao de `meu_circuito` (o topModule) ...

    initial begin
        $dumpfile("saida.vcd");
        $dumpvars(0, meu_circuito_tb);
        // ... estimulos ...
        $finish;
    end
endmodule
```

## Limites de saida da simulacao (RF04-I02)

`stdout`, `stderr` e `.vcd` tem teto proprio (`MAX_STDOUT_BYTES`,
`MAX_STDERR_BYTES`, `MAX_VCD_BYTES` em `apps/api/src/config/env.ts` —
256 KB/64 KB/2 MB por padrao), porque um teto so acima cabe em qualquer um dos
tres crescer sem limite (`$display` dentro de um loop sem controle de tempo,
por exemplo) e transportar isso pelo Redis e pela resposta HTTP ate o
navegador. O `.vcd` corta **pelo inicio do arquivo** (o cabecalho `$var` e
obrigatorio para interpretar os valores depois dele) e sempre no fim de uma
linha completa; `stdout`/`stderr` cortam **pelo fim** — as ultimas linhas
costumam ser as informativas quando algo deu errado (ex.: a linha de
`$finish`) — e tambem recuam para o inicio de uma linha completa. Nos dois
casos o corte vem com um aviso explicito no proprio texto, mais uma flag
estruturada em `SimulationResultSchema.truncated` (`{ stdout, stderr, vcd }`),
para a interface nao ter que adivinhar pelo conteudo.

## Feedback dos usuários (RF17-I01)

`POST /api/feedback` recebe relato de qualquer pessoa, sem conta: tipo
(`problema`, `sugestao`, `elogio`, `outro`), mensagem entre 20 e 2000
caracteres, contato opcional e um contexto técnico opcional (navegador, tela,
projeto aberto, desfecho da última execução, saída do compilador, identificador
anônimo de sessão). **O código do circuito nunca é enviado**, e campo
desconhecido no contexto é descartado pelo schema em vez de recusar o envio.

Dois limites protegem a rota, e eles são diferentes de propósito:

| Limite                                        | Onde                              | Conta o quê                         | Resposta                               |
| --------------------------------------------- | --------------------------------- | ----------------------------------- | -------------------------------------- |
| Rajada: 20/hora por origem                    | `@fastify/rate-limit` na rota     | requisições, inclusive as inválidas | 429 "Muitas mensagens em sequência."   |
| Diário: `FEEDBACK_MAX_PER_DAY` (5) por sessão | service, sobre o que está gravado | relatos aceitos                     | 429 "Você já enviou 5 mensagens hoje." |

O limite que o usuário lê é o diário, e ele conta só envios aceitos: o plugin de
rate limit roda antes da validação, então sozinho ele deixaria cinco tentativas
recusadas por e-mail inválido consumirem a cota do dia.

O limite diário é **por sessão anônima**, não por endereço: sem conta não há
usuário a quem atribuir a cota, e cobrar por IP faria um laboratório inteiro
dividir cinco mensagens. É frouxo de propósito — limpar os dados do navegador
reinicia a contagem —, porque o custo de bloquear um relato legítimo é maior que
o de receber uma mensagem repetida. Quando o relato vem sem contexto técnico (sem
identificador de sessão), a cota cai para o IP: mais apertada, nunca mais frouxa.
As duas chaves são gravadas com o mesmo sal, em colunas distintas (`limitKey` e
`ipHash`); nenhuma das duas guarda o valor original.

O IP de quem envia **nunca** é gravado em claro — só `SHA-256(FEEDBACK_IP_SALT + IP)`,
o suficiente para agrupar abuso. Sem `FEEDBACK_IP_SALT`
definida, a API sorteia um sal por processo e avisa no log: segue anônimo, mas os
hashes mudam a cada reinício e o limite diário zera com ele. Em produção, definir
a variável (gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

### Como ler os relatos

Não existe rota de leitura: feedback não pode ser público, e autorização só
chega com RF14. A consulta é direta no Postgres:

```bash
# Na VM, com o compose no ar
docker compose -f infra/docker-compose.yml exec postgres   psql -U tplab -d tplab -c 'SELECT "createdAt", kind, message, contact FROM "Feedback" ORDER BY "createdAt" DESC LIMIT 50;'

# Com contexto técnico, para reproduzir um problema relatado
docker compose -f infra/docker-compose.yml exec postgres   psql -U tplab -d tplab -c 'SELECT "createdAt", kind, message, context FROM "Feedback" WHERE kind = '"'"'problema'"'"' ORDER BY "createdAt" DESC LIMIT 20;'

# Exportar para anexar ao TCC
docker compose -f infra/docker-compose.yml exec postgres   psql -U tplab -d tplab --csv -c 'SELECT "createdAt", kind, message, contact, context FROM "Feedback" ORDER BY "createdAt";' > feedback.csv
```

O texto é dado de usuário: ao citar no trabalho ou abrir em planilha, tratar como
não confiável (nada de colar em terminal sem conferir, nada de renderizar como
HTML).

## Compatibilidade de navegadores (RNF02-I01)

Alvo declarado em 2026-10-03, com o piso em `build.target` (`apps/web/vite.config.ts`) e a
lista exibida ao usuário em `features/browser-support/utils/messages.ts`:

| Navegador | Versão mínima |
| --------- | ------------- |
| Chrome    | 120           |
| Firefox   | 121           |
| Edge      | 120           |
| Safari    | 17            |

- **Por quê:** é o que o Monaco 0.5x, o Tailwind v4 (`@tailwindcss/vite`) e o parser de VCD em
  Web Worker exigem sem transpilação extra; alvo mais antigo só incharia o bundle.
- **`browserslist`:** não adotado — sem PostCSS/autoprefixer (o Tailwind v4 cuida do CSS), o
  `build.target` do Vite basta.
- **Aviso:** a detecção é por **capacidade**, não por user agent (`lib/browser-support.ts`:
  Web Worker, `matchMedia`, `ResizeObserver`, canvas 2D e `structuredClone`). Faltando alguma,
  aparece uma faixa informativa, dispensável (por sessão) e que nunca bloqueia o uso (RF01).
- **Bundle com o alvo declarado:** `index` 628,05 kB (antes 625,80 kB) e `monaco` 3.271 kB (antes
  3.270 kB) — variação desprezível.
- **Reavaliar:** a cada semestre letivo ou se uma API nova entrar no código — conferir o parque
  de máquinas do laboratório, atualizar as duas listas acima e este quadro.
- **Pendente (RNF02-I02):** conferência manual nos quatro motores.

## Dimensionamento dos limites (RNF05-I02)

Cada limite abaixo tem uma medição por trás. A regra adotada: o valor é o **pior caso
legítimo medido (p95) com folga de pelo menos 3×**, arredondado para cima; o limite é o
teto de segurança, não a meta de desempenho (a meta de RNF07, 5 s, é o tempo ponta a
ponta e fica abaixo dele).

- **Data**: 2026-09-29. **Ambiente**: máquina de desenvolvimento (Windows 11, Rancher
  Desktop/WSL2, Docker 29.5.3, cgroup v2, Icarus Verilog 12.0). **A medição na VM alvo
  (Azure B2s) está pendente** — a VM só existe depois de RF01-I02; o protocolo está pronto
  e roda igual lá (ver abaixo). Os números da máquina de desenvolvimento são otimistas
  para CPU e pessimistas para o I/O de disco (o bind passa por 9p).
- **Método**: `pnpm --filter @tplab/api measure:sandbox` — 20 amostras por caso, a
  primeira descartada (cache do Docker), mediana / p95 / máximo, no container com as
  mesmas opções de `runInSandbox`; compilação e simulação separadas; pico de memória do
  cgroup (`memory.peak`).

### Exemplos de referência (ms; memória em MB)

| Caso                                                                  | criação do container | compilação | simulação   | start→saída | pico de memória | VCD     |
| --------------------------------------------------------------------- | -------------------- | ---------- | ----------- | ----------- | --------------- | ------- |
| Somador de 1 bit                                                      | 1523 / 1798 / 1841   | 10         | 10          | 1076 / 1436 | 4 / 5           | 700 B   |
| Mux 4:1                                                               | 1563 / 1805 / 1819   | 10         | 10          | 1053 / 1168 | 4 / 5           | 563 B   |
| Contador de 4 bits                                                    | 1535 / 1731 / 1855   | 10         | 10          | 1062 / 1334 | 4 / 5           | 1,5 KB  |
| ULA de 8 bits                                                         | 1449 / 1666 / 1735   | 10         | 10          | 1039 / 1167 | 4 / 5           | 1 KB    |
| Registrador de deslocamento de 8 bits                                 | 1445 / 1861 / 2465   | 10         | 10          | 944 / 1117  | 4 / 5           | 4,5 KB  |
| RAM de 1 M palavras × 32 bit (4 MiB de dados)                         | 1252 / 1414 / 1530   | 10         | 1390 / 1450 | 2031 / 2141 | 19 / 20         | —       |
| **Pesado**: contador de 16 bits, 200 mil ciclos, `$dumpvars` completo | 1484 / 1655 / 1669   | 10         | 2610 / 2710 | 3278 / 3418 | 4 / 5           | 13,3 MB |

(colunas com três números: mediana / p95 / máximo; com dois: mediana / p95. Resolução do
tempo de compilação e simulação: 10 ms.)

**O que os números dizem.** Compilar e simular um exemplo de aula leva ~20 ms; **todo o
resto do tempo é o container** — criar (~1,5 s) e iniciar/aguardar (~1 s). O limite de
tempo cobre só o `vvp`, então não tem de crescer com esse overhead (que é do RNF07).

### Cada limite, com a folga

| Limite                                   | Valor                              | Medição que o sustenta                                                                                                                                                                                                                                | Folga                                                                                                                        |
| ---------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SANDBOX_TIMEOUT_MS` (simulação)         | **10 s**                           | pior caso legítimo: 200 mil ciclos com `$dumpvars` completo, p95 = 2,7 s; RAM de 4 M palavras: 5,7 s                                                                                                                                                  | 3,7× sobre o pesado (3× → 8,1 s, arredondado para 10 s); 2× a meta de 5 s de RNF07                                           |
| `SANDBOX_COMPILE_TIMEOUT_MS`             | **5 s**                            | dois arquivos de 64 KB (o teto de `MAX_SOURCE_BYTES`): 0,66 s                                                                                                                                                                                         | 7,6×                                                                                                                         |
| `SANDBOX_MEMORY_MB`                      | **128 MB**                         | RAM de 1 M palavras: 20 MB; dois arquivos de 64 KB compilando: 40 MB; RAM de 4 M palavras (16 MiB de dados): 67 MB                                                                                                                                    | 6,4× sobre a RAM de 1 M; 3,2× sobre o pior fonte aceito; **uma RAM de 4 M palavras cabe (1,9×), acima disso `memory_limit`** |
| `SANDBOX_CPUS`                           | **0,5**                            | 0,5 → 1 CPU não muda o caso limitado por I/O (200 mil ciclos: 2,64 → 2,61 s) e dobra o limitado por CPU (RAM de 1 M: 1,41 → 0,71 s); 0,25 → 2×–4× mais lento                                                                                          | 2 jobs × 0,5 = 1 CPU dos 2 vCPU da B2s: sobra 1 CPU para API, worker, Postgres e Redis                                       |
| `PidsLimit`                              | **128**                            | uma simulação usa `sh` + `timeout` + `vvp` (~3 processos); contido em 128 (RNF04-I01)                                                                                                                                                                 | ~40×                                                                                                                         |
| `MAX_SOURCE_BYTES`                       | **64 KB por arquivo** (era 256 KB) | dois arquivos de **64 KB** compilam em 0,66 s / 40 MB; de **128 KB**, 2,0 s / 77 MB (2,5× e 1,7× — abaixo da folga de 3×); de **256 KB**, 2,5 s / 75 MB **por arquivo** (o par, extrapolado, passaria dos 128 MB). O maior exemplo real tem poucos KB | com 64 KB, 7,6× no tempo e 3,2× na memória do pior fonte aceito; ~30× o maior exemplo real                                   |
| `MAX_VCD_BYTES` (leitura)                | **2 MiB**                          | o pesado gera 13,3 MB de VCD — o visualizador recebe os primeiros 2 MiB, com aviso (RF04-I02)                                                                                                                                                         | —                                                                                                                            |
| Arquivo gravado (`ulimit -f`, RNF04-I03) | **16 MiB**                         | cobre o VCD do pesado (13,3 MB); acima disso o container termina com exit 153 e a mensagem "Arquivo grande demais"                                                                                                                                    | 1,2× sobre o pesado; ≥ `MAX_VCD_BYTES` (escrever menos do que se lê seria incoerente)                                        |
| `MAX_STDOUT_BYTES` / `MAX_STDERR_BYTES`  | 256 KB / 64 KB                     | exemplos: < 1 KB de saída                                                                                                                                                                                                                             | > 250×                                                                                                                       |

**Por que `MAX_SOURCE_BYTES` caiu de 256 KB para 64 KB.** Era o único limite que não
fechava a conta: o par de arquivos que o contrato aceitava (2 × 256 KB) não cabia nos
tetos de compilação (5 s) nem de memória (128 MB) — uma submissão válida falharia com
"limite de memória" ou "tempo de compilação" sem o usuário ter feito nada de errado.
Reduzir o fonte é melhor que inflar os limites da VM para acomodar entrada que nenhum
exercício produz. O texto de ajuda que cita "256 KB" (`inicio-rapido.tsx`) é atualizado
na PR de front correspondente.

### Coerência entre `MAX_VCD_BYTES`, retenção e o teto de RF04-I02

Os três números foram decididos juntos. Pior caso por resultado guardado no Redis:
2 MiB (VCD) + 256 KB (stdout) + 64 KB (stderr) ≈ **2,3 MiB**; com `JOB_RETENTION_COUNT = 100`,
**≈ 230 MiB no pior caso** (hoje, com uso real, o Redis ocupa 11,6 MB). O tamanho de escrita
(16 MiB) é ≥ o de leitura (2 MiB) ≥ o que a retenção comporta por job.

### Dois jobs simultâneos no limite cabem na VM

Medido em repouso: worker 32 MiB, Postgres 37 MiB, Redis 18 MiB; API estimada em ~100 MB
(não medida). Pior caso somado, com tudo no limite: 2 × 128 MB (sandboxes) + 32 (worker)

- ~100 (API) + ~150 (Postgres sob carga) + 230 (Redis, retenção cheia) + ~30 (proxy do
  socket) + ~1 GB (Docker, kernel e SO) ≈ **1,9 GB dos 4 GiB da B2s** — folga de ~2×.

### Repetir na VM alvo

```bash
pnpm sandbox:build
pnpm --filter @tplab/api measure:sandbox        # exemplos, 20 amostras
pnpm --filter @tplab/api measure:sandbox cap    # compilação no teto de MAX_SOURCE_BYTES
pnpm --filter @tplab/api measure:sandbox cpu    # efeito de SANDBOX_CPUS
docker info --format '{{.SwapLimit}}'           # deve ser true (ver docs/SEGURANCA.md)
```

Se o p95 do caso pesado passar de ~3 s na VM, revisar `SANDBOX_TIMEOUT_MS` e a folga de
3× (a regra é a mesma, o número muda).

## Estado atual

Ja implementado:

- Monorepo pnpm com contratos Zod compartilhados entre frontend e API
- API Fastify com `/health`, CRUD de projetos e endpoints de simulacao
- Persistencia de projetos em PostgreSQL via Prisma (RF07-I01), atras da
  interface `ProjectRepository` (`apps/api/src/domain/projects/`) — sem
  `DATABASE_URL`, cai em memoria para desenvolvimento rapido
- Pagina "Meus projetos" (RF07-I02): criar, listar, renomear e excluir, com
  busca e undo na exclusao — persistidos no `localStorage` do navegador por
  enquanto (RF14/login ainda nao existe; o backend de RF07-I01 fica pronto
  para quando existir)
- Vinculo continuo entre o workspace e o projeto aberto (RF07-I03): alteracoes
  nao salvas indicadas no cabecalho, salvar com `Ctrl+S` ou pelo botao,
  rascunho local com debounce (recuperavel ao reabrir ou apos recarregar a
  pagina), aviso do navegador ao fechar/recarregar com pendencias e
  confirmacao ao trocar de projeto ou voltar para a lista
- Worker BullMQ, runner do sandbox Docker e parser de diagnosticos (com testes)
- Frontend com editor Monaco (Verilog), painies redimensionaveis, console de erros
  e tema claro/escuro
- Visualizador de formas de onda (RF06): parser de `.vcd` em Web Worker,
  renderizacao em canvas (sinais escalares e barramentos, cores/geometria do
  Figma), zoom/deslocamento por mouse e teclado, selecao de sinais com busca,
  cursor de tempo com leitura textual dos valores em tabela acessivel e recorte
  de transicoes por viewport para arquivos grandes (RF06-I04)
- Exportacao de projetos em `.zip` (RF08): montado no navegador (design,
  testbench e `project.json`/`README.txt`), a partir da lista ("Exportar" no
  menu de acoes) ou do workspace (fontes ao vivo do editor, sem exigir salvar
  antes) — client-side porque os projetos ainda vivem so no `localStorage`
  (ver RF07-I02); o endpoint de servidor original fica documentado e adiado
  para quando RF14 existir
- Documentacao dentro da aplicacao (RF11): pagina propria (nao sobreposta ao
  workspace, decisao do Figma), acessivel do workspace e de "Meus projetos",
  com indice agrupado por categoria, busca por titulo/resumo (com
  redirecionamento para termos fora de escopo), navegacao Anterior/Proximo e
  blocos de codigo copiaveis/abriveis no editor (com dialogo "Onde abrir"
  quando ha projeto aberto) — inclui o guia "Primeiro projeto" completo (tres
  erros de compilacao reais capturados no `iverilog`) e a referencia "Sintaxe
  basica de Verilog" (estrutura de modulo, `wire`/`reg`, valores, operadores,
  `always`/`case`, testbench, o que fica fora desta versao), com todo exemplo
  compilado de verdade contra o `iverilog -g2012`

- Atalhos de teclado do workspace (RF09-I02), gerados de um registro unico e
  listados no dialogo "Atalhos de teclado" (`?` ou botao no cabecalho):
  `Ctrl/Cmd+Enter` executa (inclusive com o foco no editor), `Ctrl/Cmd+S` salva,
  `F8`/`Shift+F8` percorrem erros e avisos (com retorno ao inicio), `Esc` sai do
  editor para a navegacao por Tab. Tamanho dos paineis persistido, com botao
  "Restaurar layout padrao" (RF09-I01)

- Barra de estado no rodape (RF09-I03) com o desfecho da ultima execucao, duracao,
  contagem de erros/avisos, cursor e estado do projeto; abas de arquivo e
  divisores com semantica acessivel (ARIA, rotulos, ajuste por teclado)

Evidencia de desempenho (RNF07), medida com o painel de performance do Chrome
sobre um `.vcd` real de ~8 MiB (teto do sandbox na epoca da medicao, truncado)
gerado por uma simulacao de ~400 mil ciclos de clock. O teto foi reduzido para
2 MiB desde entao (RF03-I03, ver abaixo) — o numero aqui documenta o parser
sob a carga que ele enfrentou, nao o teto atual:

- Parse (worker, incluindo ida e volta de `postMessage`): **~1823 ms**, fora da
  main thread — a UI permanece responsiva durante a interpretacao.
- Primeiro desenho apos os dados chegarem (`draw()`, zoom "ajustar tudo"):
  **~113 ms**.
- Gesto de zoom (sucessivos cliques de "aumentar zoom", viewport encolhendo):
  **~112 ms -> ~33 ms -> ~41 ms -> ~27 ms -> ~28 ms -> ~8 ms**, decrescendo
  porque `sliceTransitionsForViewport` (busca binaria) e
  `reduceSegmentsForPixels` (reducao por coluna de pixel) limitam o trabalho de
  desenho ao intervalo de tempo realmente visivel.

Retencao e memoria do Redis (RF03-I03): `MAX_VCD_BYTES` caiu de 8 MiB para
2 MiB e `stdout`/`stderr` passaram a ser truncados em 256 KB cada, com aviso
explicito no corte — o corte do `.vcd` sempre fica no fim de uma linha
completa, para o parser de RF06 nunca receber um registro pela metade.
Medido contra o Redis real deste ambiente
(`docker exec tplab-redis-1 redis-cli info memory`), submetendo simulacoes
que batem no novo teto de 2 MiB (contador de 32 bits por ~400 mil ciclos):
cada job retido custou **~7,5 MiB** de `used_memory` (dois jobs consecutivos:
+7,45 MiB e +7,54 MiB). Com `JOB_RETENTION_COUNT=100`, o pior caso sustentado
(100 jobs simultaneamente retidos, todos no teto) fica em torno de **~750 MiB**
— dentro da memoria da VM B2s de producao (4 GiB) mesmo no cenario mais caro;
o limite antigo (8 MiB de `.vcd`, ate 500 jobs retidos) nao tinha teto
equivalente medido, mas a conta ingenua (8 MiB x 500) ja excedia os 4 GiB
sozinha, sem contar overhead do Redis.

Pendente:

- [ ] Autenticacao Google e compartilhamento por link (RF14/RF15)
- [ ] Editor visual de circuitos com React Flow (RF12/RF13)

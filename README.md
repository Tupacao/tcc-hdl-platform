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
| `pnpm --filter @tplab/api exec prisma migrate dev`    | Cria/aplica migracao a partir do schema (dev)             |
| `pnpm --filter @tplab/api exec prisma migrate deploy` | Aplica migracoes pendentes (producao/CI)                  |

## Fluxo de uma simulacao

1. O frontend envia `POST /api/simulations` com o design e o testbench, validados
   pelo `CompileRequestSchema` de `packages/shared`.
2. A API enfileira o job no BullMQ e responde `202` com o `jobId`.
3. O worker cria um container efemero (`--network=none`, 128 MB, 0.5 CPU, rootfs
   somente leitura, timeout de 10 s) que roda `iverilog` e `vvp` (RNF04/RNF05).
4. A saida do `iverilog` e convertida em diagnosticos com numero de linha (RF05) e
   o `.vcd` gerado volta para o visualizador de formas de onda (RF06).
5. O frontend acompanha o job por polling em `GET /api/simulations/:jobId`.

> Codigo submetido pelo usuario **nunca** e executado no processo da API — sempre
> pelo caminho `runInSandbox`.

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
sobre um `.vcd` real de ~8 MiB (teto do sandbox, truncado) gerado por uma
simulacao de ~400 mil ciclos de clock:

- Parse (worker, incluindo ida e volta de `postMessage`): **~1823 ms**, fora da
  main thread — a UI permanece responsiva durante a interpretacao.
- Primeiro desenho apos os dados chegarem (`draw()`, zoom "ajustar tudo"):
  **~113 ms**.
- Gesto de zoom (sucessivos cliques de "aumentar zoom", viewport encolhendo):
  **~112 ms -> ~33 ms -> ~41 ms -> ~27 ms -> ~28 ms -> ~8 ms**, decrescendo
  porque `sliceTransitionsForViewport` (busca binaria) e
  `reduceSegmentsForPixels` (reducao por coluna de pixel) limitam o trabalho de
  desenho ao intervalo de tempo realmente visivel.

Pendente:

- [ ] Autenticacao Google e compartilhamento por link (RF14/RF15)
- [ ] Editor visual de circuitos com React Flow (RF12/RF13)

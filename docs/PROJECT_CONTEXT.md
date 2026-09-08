# Contexto do Projeto — Plataforma Web Educacional para HDL

> Documento de referência para orientar o desenvolvimento assistido por IA (Claude Code).
> Consolida a stack tecnológica definida e os requisitos do MVP extraídos do TCC.

---

## 1. Visão Geral

Plataforma web educacional para desenvolvimento e simulação de circuitos digitais em
HDL (Verilog no MVP), acessível inteiramente pelo navegador, sem instalação local,
voltada a estudantes iniciantes. Inspirada em três referências: **EDA Playground**
(acesso via navegador), **SHDL** (abordagem didática) e **CircuitVerse** (interação
visual com circuitos).

Prazo de implementação do MVP: ~1 mês. Hospedagem prevista: 2 meses (Azure for
Students, crédito de $100).

---

## 2. Stack Tecnológica

### 2.1 Frontend

| Item                                     | Tecnologia                                                                | Observações                                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build tool / framework                   | **React + Vite**                                                          | SPA                                                                                                                                                                                                   |
| Linguagem                                | **TypeScript**                                                            |                                                                                                                                                                                                       |
| Biblioteca de componentes                | **shadcn/ui + Tailwind CSS**                                              | Componentes copiados ao projeto (não runtime pesado), construídos sobre Radix UI. Acessibilidade (ARIA, foco, teclado) de fábrica → ajuda RNF09 (WCAG AA). Tema claro/escuro via CSS variables → RF10 |
| Editor de código                         | **Monaco Editor**                                                         | Syntax highlight, base para autocomplete (RF02, RF18)                                                                                                                                                 |
| Layout redimensionável                   | **react-resizable-panels**                                                | Editor / console de erros / waveform em painéis arrastáveis                                                                                                                                           |
| Visualizador de formas de onda           | **WaveDrom** (simples) ou adaptação de leitor de VCD                      | RF06                                                                                                                                                                                                  |
| Editor visual de circuitos (Should Have) | Base em **React Flow**, referência de UX no código aberto do CircuitVerse | RF12, RF13, RF21                                                                                                                                                                                      |
| Notificações/toasts                      | **sonner**                                                                |                                                                                                                                                                                                       |
| Tutorial guiado (Should Have)            | **driver.js** ou **Intro.js**                                             | RF16                                                                                                                                                                                                  |
| i18n (fora do MVP)                       | **i18next**                                                               | Preparar estrutura, não implementar agora                                                                                                                                                             |

### 2.2 Backend

| Item                                | Tecnologia                                | Observações                                                 |
| ----------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Runtime / framework                 | **Node.js + Fastify**                     |                                                             |
| Linguagem                           | **TypeScript**                            |                                                             |
| Validação / schemas                 | **Zod** (via `fastify-type-provider-zod`) | Compartilhado com o frontend (ver monorepo)                 |
| Fila de jobs (compilação/simulação) | **BullMQ** + **Redis**                    | Evita bloquear a API durante compilação; atende RNF05/RNF07 |
| Autenticação (Should Have)          | OAuth2 com Google (ex: Auth.js)           | RF14, RNF06                                                 |
| ORM (sugestão)                      | **Prisma** ou **Drizzle**                 | Para PostgreSQL                                             |

### 2.3 Execução isolada de código HDL (núcleo crítico — RNF04)

- **Compilador/simulador**: Icarus Verilog (`iverilog` + `vvp`)
- **Sandbox**: um container Docker efêmero por submissão, disparado do Fastify via
  **dockerode** (acesso ao `/var/run/docker.sock`)
  - Limites de recurso: `--memory=128m`, `--cpus=0.5`
  - Sem rede: `--network=none`
  - Filesystem somente leitura exceto diretório temporário
  - Timeout do processo (ex: 10s) controlado no backend
  - `--rm` automático ao final
- Erros de compilação (`iverilog`) são parseados para extrair número de linha →
  mensagens contextualizadas (RF05)
- Saída do `vvp` gera arquivo `.vcd`, devolvido ao frontend para renderização (RF06)
- Arquitetura pensada para permitir, no futuro, plugar **GHDL** (VHDL) e
  **Yosys + nextpnr** (síntese lógica) como novos tipos de job na mesma fila (RNF08)

### 2.4 Dados e armazenamento

| Item                                 | Tecnologia             | Observações                                                    |
| ------------------------------------ | ---------------------- | -------------------------------------------------------------- |
| Banco relacional                     | **PostgreSQL**         | Container Docker na mesma VM (sem custo de serviço gerenciado) |
| Cache / fila                         | **Redis**              | Container Docker na mesma VM                                   |
| Armazenamento de arquivos exportados | **Azure Blob Storage** | RF08, RF15                                                     |

### 2.5 Estrutura do repositório (monorepo)

```
tcc-hdl-platform/
├── apps/
│   ├── web/              # React + Vite + shadcn (frontend)
│   └── api/               # Fastify + TypeScript (backend)
├── packages/
│   └── shared/            # Schemas Zod + tipos compartilhados entre web e api
│       ├── schemas/        # ex: CompileRequestSchema, ProjectSchema
│       └── types/
├── infra/
│   └── docker-compose.yml  # Postgres, Redis, api, worker de compilação
├── pnpm-workspace.yaml
└── package.json
```

- **Gerenciador de workspace**: pnpm workspaces (Turborepo pode ser adicionado depois
  se necessário cache de build entre pacotes)
- Tipos e validação (Zod) compartilhados entre `apps/web` e `apps/api` via
  `packages/shared`, eliminando duplicação de contratos de API

### 2.6 Hospedagem (Azure for Students — orçamento ~$100 / 2 meses)

| Componente                                       | Serviço Azure                                                                      | Custo estimado (2 meses)             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------ |
| Frontend (build estático)                        | **Azure Static Web Apps** (tier Free)                                              | $0                                   |
| Backend + Postgres + Redis + sandbox de execução | **1x VM Standard_B2s** (2 vCPU, 4 GiB, Linux), tudo orquestrado via Docker Compose | ~$60,80                              |
| Disco gerenciado (Standard SSD, 32GB)            |                                                                                    | ~$5,00                               |
| IP público estático                              |                                                                                    | ~$7,00                               |
| Blob Storage (exports de projetos)               |                                                                                    | ~$2,00                               |
| **Total estimado**                               |                                                                                    | **~$75 (dentro do crédito de $100)** |

Observações:

- Serviços gerenciados de banco/cache (Azure Database for PostgreSQL, Azure Cache for
  Redis) foram descartados nesta fase por custo (~$12–20/mês cada) — Postgres e Redis
  rodam como containers na própria VM.
- A VM pode ser desligada (deallocated) fora dos períodos de uso/demonstração para
  reduzir o gasto de compute.

---

## 3. Requisitos Funcionais

### 3.1 Must Have (núcleo do MVP)

| ID   | Descrição                                                                          |
| ---- | ---------------------------------------------------------------------------------- |
| RF01 | Acessível integralmente por navegador, sem instalação local                        |
| RF02 | Editor de código Verilog com destaque de sintaxe                                   |
| RF03 | Compilação do código HDL em ambiente de execução no servidor                       |
| RF04 | Execução da simulação a partir de testbench fornecido pelo usuário                 |
| RF05 | Mensagens de erro de compilação contextualizadas, indicando a linha correspondente |
| RF06 | Exibição das formas de onda em visualizador gráfico interativo                     |
| RF07 | CRUD de projetos: criar, listar, abrir, renomear, excluir                          |
| RF08 | Exportação de projetos em formato compactado (código-fonte + testbench)            |
| RF09 | Editor, compilador, simulador e visualizador integrados em uma única interface     |
| RF10 | Alternância entre modo claro e escuro                                              |
| RF11 | Documentação estática (guia de início rápido + referência de sintaxe)              |

### 3.2 Should Have

| ID   | Descrição                                                                         |
| ---- | --------------------------------------------------------------------------------- |
| RF12 | Modelagem visual de circuitos combinacionais por editor baseado em blocos lógicos |
| RF13 | Geração de código Verilog equivalente a partir do circuito modelado visualmente   |
| RF14 | Autenticação opcional via conta Google, para persistência de projetos na nuvem    |
| RF15 | Geração de links públicos de compartilhamento de projetos                         |
| RF16 | Tutorial guiado de primeiro acesso                                                |
| RF17 | Mecanismo de envio de feedback pelos usuários                                     |

### 3.3 Could Have

| ID   | Descrição                                                               |
| ---- | ----------------------------------------------------------------------- |
| RF18 | Autocompletar para palavras-chave da linguagem Verilog                  |
| RF19 | Coleta de métricas anônimas de uso                                      |
| RF20 | Projetos de exemplo pré-carregados (somador, multiplexador, contador)   |
| RF21 | Suporte a componentes sequenciais básicos (flip-flops) no editor visual |

---

## 4. Requisitos Não Funcionais

| ID    | Descrição                                                                            |
| ----- | ------------------------------------------------------------------------------------ |
| RNF01 | Interface simples, orientada a usuários iniciantes                                   |
| RNF02 | Compatibilidade com versões recentes de Chrome, Firefox, Edge e Safari               |
| RNF03 | Interface responsiva, resolução mínima recomendada de 1024px                         |
| RNF04 | Código do usuário executado em ambiente isolado (containers)                         |
| RNF05 | Limites de tempo e consumo de memória por execução de simulação                      |
| RNF06 | Autenticação e autorização para acesso a projetos privados                           |
| RNF07 | Simulações de baixa complexidade devem responder em menos de 5 segundos              |
| RNF08 | Arquitetura modular, permitindo integração futura com síntese lógica e gravação FPGA |
| RNF09 | Interface deve atender nível AA do WCAG para contraste de cores, em ambos os modos   |

---

## 5. Explicitamente fora do escopo do MVP (Won't Have)

Preparar a arquitetura para acomodar futuramente, mas **não implementar agora**:

- Síntese lógica, posicionamento, roteamento e geração de bitstream
- Gravação em dispositivos FPGA e integração com laboratórios remotos
- Suporte completo a VHDL e SystemVerilog (arquitetura de fila de jobs já pensada para plugar GHDL)
- Assistente baseado em LLM para geração/explicação/correção de código HDL
- Depuração avançada (breakpoints, execução passo a passo, inspeção de sinais internos)
- Edição colaborativa em tempo real
- Gestão educacional (turmas, notas, trilhas, perfis de professor/aluno)
- Internacionalização (idiomas além do português)

---

## 6. Notas para o Claude Code

- Priorizar a implementação seguindo a ordem: RF01 → RF03/RF04 (pipeline de
  compilação/simulação) → RF02/RF05/RF06 (integração no editor) → RF07/RF08/RF09 →
  RF10/RF11 → itens Should/Could Have, conforme tempo disponível.
- Toda validação de entrada/saída da API deve usar os schemas Zod definidos em
  `packages/shared`, reaproveitados no frontend.
- Qualquer execução de código submetido pelo usuário **deve** passar pelo fluxo de
  sandbox descrito na seção 2.3 — nunca executar `iverilog`/`vvp` diretamente no
  processo do backend.
- Ao gerar componentes de UI, seguir o padrão shadcn/ui + Tailwind já definido, não
  introduzir MUI ou outra lib de componentes concorrente.

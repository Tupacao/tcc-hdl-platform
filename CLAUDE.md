# CLAUDE.md

Monorepo pnpm do TPLab, plataforma web educacional para HDL (TCC).
Requisitos e decisoes de stack: `docs/PROJECT_CONTEXT.md` — consulte antes de
introduzir dependencias ou mudar arquitetura.

## Comandos

```bash
pnpm install
pnpm dev                 # web (5173) + api (3333)
pnpm dev:worker          # worker da fila de simulacao
pnpm typecheck           # tipos de todo o monorepo
pnpm build
pnpm --filter @tplab/api test
pnpm sandbox:build       # imagem tplab-sandbox:latest
```

## Arquitetura

- `packages/shared` e a **unica** fonte dos contratos de API. Toda rota do Fastify e
  toda chamada do frontend valida com os schemas Zod definidos la; nao duplicar tipos.
- Compilacao/simulacao nunca roda no processo da API: a rota enfileira no BullMQ e o
  worker (`apps/api/src/worker.ts`) executa via `runInSandbox`, em container Docker
  efemero sem rede e com limites de CPU/memoria (RNF04/RNF05).
- O `.vcd` produzido pelo `vvp` volta ao frontend como string e alimenta o
  visualizador de formas de onda (RF06).
- A arquitetura de fila e por tipo de job: GHDL (VHDL) e Yosys entram como novos
  jobs, sem mudar a API (RNF08).

## Convencoes

- TypeScript estrito, ESM. Imports relativos em `apps/api` e `packages/shared` usam
  extensao `.js` (moduleResolution NodeNext).
- UI: apenas shadcn/ui + Tailwind. Nao introduzir MUI, Chakra ou outra lib de
  componentes concorrente.
- Cores sempre pelos tokens de tema (`bg-background`, `text-muted-foreground`, ...),
  para manter contraste AA nos modos claro e escuro (RF10/RNF09).
- Comentarios e textos de interface em portugues, sem acentuacao em arquivos de
  codigo para evitar problemas de encoding no Windows.

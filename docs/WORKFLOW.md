# Workflow de Implementacao — TPLab

> Processo obrigatorio para qualquer tarefa de implementacao neste repositorio,
> feita por Claude Code ou por qualquer colaborador. Referenciado por `CLAUDE.md`,
> que e carregado automaticamente em toda sessao.

Ordem fixa. Nao pular etapas, nao inverter a ordem 4↔5 (implementar so depois
valida e escreve teste — nunca o contrario).

## 0. Repositorio

`https://github.com/Tupacao/tcc-hdl-platform` — usar esta URL (via MCP do GitHub,
quando disponivel, ou `gh`/`git`) para checar branches, PRs abertas e status de CI
antes de comecar uma tarefa, sempre que a tarefa depender do estado atual do
remoto.

> **As issues NAO ficam no GitHub.** Este repositorio nao usa o rastreador de
> Issues do GitHub (verificado: todas as entradas do repo sao Pull Requests, zero
> Issues) — o backlog inteiro vive em `docs/requisitos/funcional/RF*/` (um
> `feature.md` por requisito, quebrado em `issue-NN-*.md`). "Proxima issue",
> "importar issue" etc. sempre significam consultar essa arvore de markdown, nunca
> o GitHub Issues. GitHub serve so para branches/PRs/CI.

> **Todo requisito com secao de design tem um `figma/WILL-BE-DONE.md` dentro da
> pasta `RFxx/` — leia-o e abra os links do Figma nele referenciados (MCP
> `claude_ai_Figma`: `get_design_context`/`get_screenshot`/`get_metadata`) ANTES
> de implementar qualquer coisa de interface daquele requisito.** Esse doc nao e
> so um placeholder: costuma conter decisoes de navegacao ja fechadas, texto de
> tela, hierarquia de acoes (qual botao e primario) e comportamento de casos de
> borda (ex.: estado vazio de busca) que nao estao em lugar nenhum do
> `issue-NN-*.md`. Pular esse passo produz uma implementacao plausivel porem
> errada em detalhes que so o design define — ja aconteceu (RF11-I01: painel
> sobreposto ao workspace quando o Figma ja tinha fechado "pagina propria").

## 1. Identificar o escopo e o lado (front/back)

- Determinar se a tarefa e front, back, ou as duas coisas.
- Se for as duas, tratar como **duas tarefas independentes**, cada uma com sua
  propria branch e seu proprio PR (ver `docs/ARCHITECTURE.md#3-git-branches-e-commits`).
  Nao editar front e back na mesma branch.

## 2. Criar a branch

Antes de tocar em qualquer arquivo, criar a branch a partir da `main` atualizada,
seguindo o padrao:

```
feat-RNXX-NumeroIssue-NomeDaIssue-front
feat-RNXX-NumeroIssue-NomeDaIssue-back
fix-NomeDoBug-front
fix-NomeDoBug-back
```

Se a tarefa nao tem issue/RF associado, usar `fix-` ou o nome descritivo mais
proximo — nunca commitar direto na `main` (esta bloqueada) nem reaproveitar uma
branch de outro escopo.

## 3. Consultar a arquitetura

Antes de escrever codigo: se a tarefa toca interface, primeiro `docs/requisitos/funcional/RFxx/figma/WILL-BE-DONE.md`
e os links do Figma nele (ver alerta na secao 0) - so depois reler
`docs/ARCHITECTURE.md` e mapear onde cada arquivo novo vai entrar:

- Front: qual feature em `apps/web/src/features/`, e dentro dela o que e
  `components/`, `hooks/`, `utils/`, `models/`, `styles/`.
- Back: qual feature em `application/<feature>/{controller,service,repository}`,
  quais contratos ja existem ou precisam ser criados em
  `domain/<feature>/{entities,dtos,enums,repositories,services,mappers}`.
- Contratos de API sempre em `packages/shared` (`z.infer`, nunca duplicar tipo) —
  ver `CLAUDE.md`.
- Se a tarefa toca um modulo antigo fora do padrao (ex.: `modules/*` no back),
  decidir junto com o escopo da tarefa se a migracao para
  `application/domain/infra` acontece agora ou fica para uma tarefa dedicada —
  nao migrar silenciosamente algo fora do escopo pedido.

## 4. Implementar por completo

Fazer a implementacao inteira da funcionalidade/correcao — todas as camadas
envolvidas (ex.: back: entity → repository → service → controller → rota; front:
model → hook → utils → components → index) — **antes** de escrever qualquer
teste. O objetivo desta etapa e ter a funcionalidade correta e validavel
manualmente (typecheck limpo, app rodando, comportamento conferido), nao
cobertura de teste.

## 5. Validar e so entao testar

Com a implementacao completa:

1. Rodar `pnpm typecheck` (e `pnpm --filter <app> build` quando relevante).
2. Validar o comportamento manualmente (ver "Frontend" abaixo para UI).
3. Corrigir o que estiver errado nesta etapa — a implementacao so passa para
   "pronta" quando o comportamento esperado e confirmado.
4. **Somente depois** de validada, escrever os testes:
   - Back: espelhar `application/<feature>/...` em `tests/`, rodar
     `pnpm --filter @tplab/api test`.
   - Front: espelhar `index`, `components/` e `utils/` em `__tests__/` (hooks nao
     sao testados).

## Frontend — validacao em navegador

Para mudanca de UI, subir `pnpm dev`, usar a feature de verdade (ou o MCP
`chrome-devtools` para inspecionar `localhost:5173`, console e screenshots) antes
de declarar a tarefa concluida. Type-check e teste automatizado verificam
correcao de codigo, nao correcao funcional.

## 6. Commit e PR

- Commits agrupados por sentido, com prefixo (`feat:`, `fix:`, `update:`,
  `refac:`, `style:`, `prettier:`) — ver `docs/ARCHITECTURE.md#3-git-branches-e-commits`.
- Abrir PR contra `main`; CI (`ci-front.yml` ou `ci-back.yml`, conforme o lado)
  precisa estar verde antes do merge.
- Todo PR sai com:
  1. Exatamente uma label de tipo: `feature` (branch `feat-*`), `fix` (branch
     `fix-*`) ou `documentation` (mudanca so em `docs/*`/`CLAUDE.md`, sem tocar
     `apps/*`).
  2. `Tupacao` (dono do repo) adicionado como reviewer.
- Nunca fazer merge direto — mesmo com CI verde, o merge fica para o reviewer
  aprovar e mesclar pelo GitHub.

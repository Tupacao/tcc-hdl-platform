# RF07-I02 - Interface de gerenciamento de projetos

| Campo | Valor |
| --- | --- |
| Feature | [RF07](feature.md) |
| Branch | `feat-RF07-02-interface-gerenciamento-projetos-front` (padrao de `docs/WORKFLOW.md`, nao o sugerido acima) |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF07-I01 |

## Contexto

A API de projetos existe desde o inicio, mas nenhuma linha do frontend a chama:
`apps/web/src/lib/api.ts` so tem `startSimulation`, `getSimulation` e
`runSimulation`. O `Workspace` abre sempre com `SAMPLE_SOURCES` e nao tem nocao
de projeto.

Esta issue cria a primeira superficie fora do workspace, o que obriga a resolver
uma decisao de navegacao: o SPA hoje nao tem roteador (`App.tsx` renderiza
`<Workspace />` direto).

## Objetivo

Permitir que o usuario veja, crie, renomeie e exclua projetos pela interface,
usando o contrato ja existente.

## Escopo tecnico

Ver "Notas de implementacao" abaixo para os desvios (persistencia local, sem
`lib/api.ts`):

- `apps/web/src/features/projects/` (novo) - `models/`, `utils/` (storage,
  validacao, formatacao, mensagens), `hooks/use-local-projects.ts`,
  `components/` (pagina, cartao, menu de acoes, 3 dialogos)
- `apps/web/src/App.tsx` - estado de navegacao entre lista e workspace
- `apps/web/src/features/workspace/workspace.tsx` - `initialSources`/`onOpenProjects`
- `apps/web/src/components/ui/` - `dialog`, `alert-dialog`, `dropdown-menu`,
  `radio-group`, `label` do shadcn/ui (`textarea`/`badge` tambem instalados
  nesta issue mas ainda sem uso - ver nota sobre descricao abaixo)

## Passo a passo

1. Adicionar em `lib/api.ts`: `listProjects`, `getProject`, `createProject`,
   `updateProject` e `deleteProject`, todas validando a resposta com os schemas
   de `@tplab/shared`, no mesmo padrao do `request<T>` existente.
2. Decidir a navegacao. Recomendacao: manter o SPA sem roteador nesta etapa e
   abrir a lista como painel/dialogo sobre o workspace, preservando a promessa de
   "interface unica" de RF09. Se RF11 exigir rotas, introduzir o roteador la e
   migrar a lista junto - a decisao precisa ser registrada no `README.md` de um
   jeito ou de outro.
3. Construir a lista: nome, descricao, data de atualizacao formatada em
   `pt-BR`, e um menu por item com abrir, renomear, excluir e (depois) exportar.
4. Criar projeto: dialogo com nome (obrigatorio, ate 120 caracteres, conforme
   `CreateProjectSchema`) e descricao opcional (ate 500). Oferecer comecar em
   branco ou a partir dos exemplos de `samples.ts` - o gancho de RF20.
5. Renomear: dialogo com o nome atual pre-preenchido, enviando `PATCH` apenas com
   os campos alterados.
6. Excluir: `AlertDialog` com o nome do projeto no texto, acao destrutiva
   explicita. Nao ha desfazer - avisar disso.
7. Estados: carregando, lista vazia, erro de conexao com acao de tentar de novo.
   Refletir os limites dos schemas na validacao do formulario, para o erro
   aparecer antes da requisicao.
8. Feedback com `sonner`, ja usado no projeto.
9. Acessibilidade: dialogos com foco preso e retorno do foco ao fechar (o Radix
   entrega isso), lista navegavel por teclado, acoes com rotulo textual e nao so
   icone.

## Criterios de aceite

- [x] Criar, renomear e excluir refletem na lista sem recarregar a pagina.
- [x] A lista mostra nome, descricao e data de atualizacao, mais recente primeiro.
- [x] Nome vazio ou acima de 120 caracteres e barrado antes da requisicao.
- [x] Excluir exige confirmacao com o nome do projeto visivel.
- [x] Lista vazia oferece caminho para criar o primeiro projeto.
- [x] ~~Erro de rede~~ Erro de leitura/escrita no `localStorage` mostra mensagem e acao de tentar de novo.
- [x] Todo o fluxo e operavel por teclado, com foco visivel e retorno de foco ao fechar dialogos.
- [x] ~~Toda resposta da API~~ Todo dado lido do `localStorage` e validado pelo schema (`LocalProjectSchema`).

### Notas de implementacao (desvios do passo a passo)

**Persistencia local, nao a API real (decisao do usuario, RF14 em jogo).** O
Figma desta feature (frames 6.1-6.3) descreve armazenamento local no navegador
("salvos neste navegador", sem conta, exportar `.zip` para nao perder nada) -
o oposto do que RF07-I01 construiu (Postgres compartilhado via
`/api/projects`). Apresentei a divergencia antes de comecar; a decisao foi:
enquanto RF14 (login) nao existir, nada e salvo no banco - a UI usa
`localStorage` (`hooks/use-local-projects.ts`, `utils/storage.ts`), e o
backend do RF07-I01 fica pronto para quando a conta existir. A reconciliacao
(anonimo = local, autenticado = nuvem) e explicitamente o escopo de
**RF14-I03**, que ja depende desta issue. Por isso:

- `lib/api.ts` **nao** ganhou `listProjects`/`createProject`/etc. - nao ha
  chamada de API nesta issue.
- `LocalProject` (`models/types.ts`) nao e o mesmo tipo de `ProjectSchema` de
  `packages/shared` - reaproveita `HdlSources` (a unica parte que de fato
  coincide) e adiciona um campo so local (`lastRun`, para o badge de status do
  card). Criterios sobre "resposta da API" foram reinterpretados para "dado
  lido do `localStorage`", com o mesmo espirito (nao confiar cegamente em dado
  nao validado na borda).

**Navegacao: pagina propria, sem roteador.** O Figma fechou essa decisao
("a lista de projetos e pagina propria"), ao contrario da recomendacao original
desta issue (dialogo/painel sobre o workspace). Implementado com um estado
`view` simples em `App.tsx` (`'workspace' | 'projects'`), sem introduzir
react-router - `Workspace` ganhou `initialSources`/`onOpenProjects` como props
opcionais para permitir a troca sem reescrever seu estado interno.

**Catalogo de exemplos: so 1, nao 3.** O dialogo "Novo projeto" do Figma mostra
"Somador de 4 bits" e "Multiplexador 4→1" alem do branco - esses exemplos nao
existem ainda (RF20, "Could Have", ainda nao iniciado). A UI oferece o unico
exemplo real de `lib/samples.ts` (`full_adder`), renomeado dinamicamente para o
nome escolhido (`utils/project-sources.ts`) para o titulo do card e o nome real
do arquivo no editor nunca divergirem. Criar mais exemplos aqui seria escopo de
RF20, nao desta issue.

**Bug de acessibilidade real, achado e corrigido pela auditoria (skill
`a11y-audit`).** O passo 9 supunha "o Radix entrega [retorno de foco] de
graca" - verdade **so** quando o dialogo abre via um `DialogTrigger`/
`AlertDialogTrigger` fixo. Aqui os 3 dialogos abrem de varios botoes diferentes
(cabecalho, cards, estado vazio), entao isso nao se aplica - sem correcao, Escape/
Cancelar jogava o foco no `<body>`. Corrigido com: (1) capturar o elemento que
tinha foco (ou, no caso do menu "..." do card, o proprio botao via
`event.currentTarget` no `onPointerDown` - o Radix abre o menu no `pointerdown`
e suprime o `click` seguinte, entao capturar em `onClick` nunca dispara, e
`document.activeElement` no `pointerdown` ainda e o elemento anterior, nao o
botao clicado); (2) restaurar o foco de dentro do proprio `onCloseAutoFocus` do
Radix (com `preventDefault`), nao em `onOpenChange` - o `onCloseAutoFocus`
padrao roda depois e sobrescreve uma restauracao feita mais cedo. Ver
`components/projects-page.tsx`, `project-actions-menu.tsx` e os 3 dialogos.

**Cartao sem `role="button"` no elemento inteiro.** Um `role="button"`
envolvendo o menu "..." (um `<button>` de verdade) aninharia um controle
interativo dentro de outro - confuso para leitor de tela. O nome do projeto e
um `<button>` real (rotulo "Abrir X.v no editor"); o cartao inteiro ainda abre
ao clicar em qualquer ponto (conveniencia do mouse via `onClick` num `div`
sem semantica ARIA), mas o teclado usa o botao do nome ou o menu.

**Sem descricao, seguindo o Figma (nao o passo 4 acima).** O dialogo "Novo
projeto" do Figma (frame 6.2) so tem nome + ponto de partida - nenhum campo de
descricao, ao contrario do que o passo 4 desta issue previa
("descricao opcional (ate 500)"). Segui o Figma: `LocalProject.description`
existe no modelo e e exibido no card (`utils/messages.ts`, `project-card.tsx`),
mas fica sempre `null` - nao ha, ainda, nenhum dialogo que permita defini-la.
`Textarea` e `Badge` do shadcn foram instalados junto com os outros
componentes desta issue mas nao chegaram a ser usados.

**Fora do escopo desta issue (fica para I03 ou RF08):**
- `lastRun` (badge "Executado sem erros"/"Erro de compilacao") nunca sai de
  `never` - nao ha ainda um caminho que rode a simulacao a partir de um projeto
  aberto e grave o resultado de volta. Isso e o "vinculo" de RF07-I03.
- O menu "..." nao tem "Exportar .zip" (RF08 nao existe ainda).

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: com a API no ar, percorrer criar, renomear, excluir e recarregar a pagina
conferindo a persistencia.

## Riscos

- Sem autenticacao (RF14/RNF06), a lista mostra os projetos de todos os usuarios.
  Enquanto a plataforma nao estiver publica isso e aceitavel; publicar antes de
  RNF06 nao e. Registrar o aviso no `README.md`.
- Introduzir um roteador aqui por impulso espalha decisao de arquitetura por
  varias issues; se for necessario, fazer explicitamente e documentar.

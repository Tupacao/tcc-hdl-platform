# RF07-I02 - Interface de gerenciamento de projetos

| Campo | Valor |
| --- | --- |
| Feature | [RF07](feature.md) |
| Branch | `feat/rf07-interface-gerenciamento-projetos` |
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

- `apps/web/src/lib/api.ts` - funcoes de projeto
- `apps/web/src/features/projects/` (novo) - lista, dialogos e hooks
- `apps/web/src/App.tsx` - navegacao entre lista e workspace
- `apps/web/src/components/ui/` - `dialog`, `input`, `textarea`,
  `alert-dialog`, `dropdown-menu` do shadcn/ui

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

- [ ] Criar, renomear e excluir refletem na lista sem recarregar a pagina.
- [ ] A lista mostra nome, descricao e data de atualizacao, mais recente primeiro.
- [ ] Nome vazio ou acima de 120 caracteres e barrado antes da requisicao.
- [ ] Excluir exige confirmacao com o nome do projeto visivel.
- [ ] Lista vazia oferece caminho para criar o primeiro projeto.
- [ ] Erro de rede mostra mensagem e acao de tentar de novo.
- [ ] Todo o fluxo e operavel por teclado, com foco visivel.
- [ ] Toda resposta da API e validada pelo schema compartilhado.

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

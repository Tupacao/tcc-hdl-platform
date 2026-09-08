# RF07-I03 - Vinculo do workspace com o projeto aberto

| Campo | Valor |
| --- | --- |
| Feature | [RF07](feature.md) |
| Branch | `feat/rf07-vinculo-workspace-projeto` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF07-I02 |

## Contexto

O `Workspace` guarda `sources` em `useState(SAMPLE_SOURCES)` e nada mais: nao
sabe de qual projeto o codigo veio, nao sabe se foi alterado e nao tem como
gravar. Recarregar a pagina descarta tudo o que foi digitado.

`CompileRequestSchema` ja preve `projectId` opcional na submissao de simulacao,
justamente para amarrar execucao e projeto - campo que hoje nunca e preenchido.

## Objetivo

Fazer o workspace operar sobre um projeto: carregar ao abrir, indicar alteracoes
nao salvas, salvar sob demanda e nao perder trabalho por acidente.

## Escopo tecnico

- `apps/web/src/features/workspace/workspace.tsx` - estado do projeto aberto
- `apps/web/src/features/projects/use-project.ts` (novo) - carregar e salvar
- `apps/web/src/features/workspace/workspace-header.tsx` (novo) - extrair o
  cabecalho, que ja acumula responsabilidade demais
- `apps/web/src/lib/api.ts` - `projectId` na submissao

## Passo a passo

1. Introduzir no `Workspace` o estado do projeto aberto:
   `{ id, name, savedSources }`, onde `savedSources` e a ultima versao conhecida
   do servidor.
2. Derivar "alteracoes nao salvas" comparando `sources` com `savedSources`, em
   vez de manter um booleano que sai de sincronia.
3. Exibir o nome do projeto e o indicador de nao salvo no cabecalho, junto de uma
   acao "Salvar" (`PATCH` com `sources`). Atalho `Ctrl+S` / `Cmd+S`, com
   `preventDefault`, alinhado aos atalhos de RF09-I02.
4. Definir a politica de salvamento. Recomendacao para o MVP: salvamento manual
   explicito, mais um rascunho local em `localStorage` por projeto, gravado com
   debounce. Autosave no servidor a cada tecla gasta banda e escrita no Postgres
   sem necessidade; rascunho local cobre o caso de fechar a aba por acidente.
5. Ao abrir um projeto com rascunho local mais novo que o `updatedAt` do
   servidor, perguntar qual versao usar - nunca sobrescrever em silencio.
6. `beforeunload` avisando quando houver alteracoes nao salvas, e o mesmo aviso ao
   trocar de projeto ou voltar para a lista.
7. Preencher `projectId` na chamada de `runSimulation` quando houver projeto
   aberto.
8. Manter o modo sem projeto (rascunho anonimo com `SAMPLE_SOURCES`), que e o
   primeiro contato de quem chega pela URL publica: nada deve exigir criar
   projeto antes de simular.
9. Depois de salvar, atualizar `savedSources` e o `updatedAt` refletido na
   interface.

## Criterios de aceite

- [ ] Abrir um projeto carrega design e testbench no editor, com os nomes de
      arquivo corretos nas abas.
- [ ] Editar marca o projeto como nao salvo; salvar limpa a marca.
- [ ] `Ctrl+S` salva sem submeter formulario nem abrir o dialogo do navegador.
- [ ] Fechar a aba com alteracoes nao salvas dispara o aviso do navegador.
- [ ] Recarregar depois de editar sem salvar oferece o rascunho local.
- [ ] Trocar de projeto com pendencias pede confirmacao.
- [ ] Simular com projeto aberto envia `projectId`.
- [ ] Sem projeto aberto, o fluxo de escrever e simular continua funcionando.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: abrir projeto, editar, recarregar, conferir o rascunho; salvar, recarregar
e conferir a versao do servidor; testar em janela privativa (sem `localStorage`).

## Riscos

- `localStorage` pode estar indisponivel (modo privativo). O `ThemeProvider` ja
  trata isso com `try/catch`; repetir o padrao e degradar sem rascunho, nunca
  quebrar.
- Rascunho local sem escopo de usuario vaza codigo entre pessoas que usam o mesmo
  navegador; revisar quando RF14 entrar.
- `beforeunload` insistente irrita; disparar somente quando houver diferenca real.

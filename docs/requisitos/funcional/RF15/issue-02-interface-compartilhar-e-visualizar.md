# RF15-I02 - Interface de compartilhar e pagina do projeto compartilhado

| Campo | Valor |
| --- | --- |
| Feature | [RF15](feature.md) |
| Branch | `feat/rf15-interface-compartilhar-e-visualizar` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF15-I01, RF07-I02 |

## Contexto

Com a API pronta, falta a interface. Esta issue tem uma exigencia que nenhuma
outra tem: **uma URL precisa abrir um projeto especifico**. Ate aqui o SPA vive
em um unico endereco (`App.tsx` renderiza `<Workspace />` direto). Um link
compartilhado nao funciona sem rota.

Se RF11-I01 ja tiver introduzido roteador, esta issue apenas acrescenta uma rota.
Se nao, e aqui que a decisao deixa de ser adiavel.

## Objetivo

Permitir gerar e revogar o link pela interface, e abrir um projeto compartilhado
por URL em modo somente leitura, com opcao de copiar para si.

## Escopo tecnico

- `apps/web/src/App.tsx` - rota `/p/:token`
- `apps/web/src/features/share/share-dialog.tsx` (novo)
- `apps/web/src/features/share/shared-project-view.tsx` (novo)
- `apps/web/src/lib/api.ts` - funcoes de compartilhamento
- `apps/web/src/features/workspace/workspace.tsx` - modo somente leitura

## Passo a passo

1. Introduzir roteamento minimo com duas rotas: raiz (workspace) e `/p/:token`.
   Se um roteador ja tiver sido adotado em RF11-I01, seguir a mesma escolha; caso
   contrario, avaliar se `react-router` se justifica ou se um roteamento proprio
   de duas rotas basta. Documentar a decisao.
2. Dialogo de compartilhamento acionavel da lista de projetos e do workspace:
   gerar o link, exibir a URL completa, copiar com confirmacao, e revogar com
   confirmacao explicando a consequencia.
3. Montar a URL a partir da origem atual (`window.location.origin`), nunca de
   valor codificado - em producao o dominio nao e o de desenvolvimento.
4. Na rota `/p/:token`, buscar o projeto e reaproveitar o `Workspace` em modo
   somente leitura, para o visitante ver o codigo, executar e ver as ondas com a
   mesma interface de sempre.
5. Definir o comportamento da edicao no modo compartilhado. Recomendacao: o
   visitante **pode** editar localmente e executar (experimentar e o que torna o
   link util em aula), mas nada e salvo e a interface deixa isso explicito. A
   alternativa - editor bloqueado - e mais simples e menos util; a escolha
   pertence ao design de RF15.
6. Acao "criar uma copia": com sessao, cria um projeto proprio com o conteudo
   atual e abre normalmente; sem sessao, leva ao login preservando a intencao.
7. Tratar token invalido ou revogado com uma tela clara e caminho de volta.
8. Ajustar o titulo da pagina e as metatags para o nome do projeto - links
   compartilhados sao colados em chats que geram previa.
9. Garantir que a acao de compartilhar so apareca para o dono.

## Criterios de aceite

- [ ] Gerar o link exibe a URL completa e copia com um clique.
- [ ] Abrir a URL em janela anonima carrega o projeto sem login.
- [ ] O visitante executa a simulacao e ve as formas de onda.
- [ ] Fica explicito que alteracoes do visitante nao sao salvas.
- [ ] "Criar uma copia" funciona com sessao e leva ao login sem ela.
- [ ] Revogar faz a URL passar a exibir a tela de link invalido.
- [ ] A URL usa a origem atual, sem dominio codificado.
- [ ] A acao de compartilhar so aparece para o dono.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: gerar link, abrir em janela anonima, executar, editar (sem salvar),
revogar e conferir que o acesso caiu.

## Riscos

- Introduzir roteador nesta issue, se nao tiver sido feito antes, muda a
  arquitetura do frontend - decisao consciente, com registro no `README.md`.
- Reaproveitar o `Workspace` em modo somente leitura tende a espalhar
  condicionais; concentrar o modo em uma unica prop e trata-la nos poucos pontos
  que salvam.

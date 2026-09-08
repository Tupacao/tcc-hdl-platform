# RF08-I02 - Acao de exportar na interface

| Campo | Valor |
| --- | --- |
| Feature | [RF08](feature.md) |
| Branch | `feat/rf08-acao-exportar-interface` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | RF08-I01, RF07-I02 |

## Contexto

Com a rota pronta, falta a acao na interface. O detalhe que decide a
implementacao: `apps/web/src/lib/api.ts` tem um unico helper `request<T>` que
sempre faz `response.json()` e valida com um schema Zod. Download binario nao
passa por ele.

Ha tambem o descompasso entre o que esta na tela e o que esta salvo: o export vem
do servidor, entao exporta a versao **salva**, nao a que o usuario acabou de
digitar (RF07-I03 introduz esse estado).

## Objetivo

Adicionar a acao de exportar na lista de projetos e no workspace, deixando claro
qual versao esta sendo baixada.

## Escopo tecnico

- `apps/web/src/lib/api.ts` - funcao de download, fora do `request<T>`
- `apps/web/src/features/projects/` - item no menu de acoes
- `apps/web/src/features/workspace/workspace-header.tsx` - acao no cabecalho

## Passo a passo

1. Escrever `downloadProjectExport(projectId, projectName)` que faz `fetch` na
   rota, checa `response.ok`, le o `Blob` e dispara o download via
   `URL.createObjectURL` com um `<a download>` temporario, revogando a URL depois.
2. Ler o nome do arquivo do `Content-Disposition` quando disponivel; cair para um
   nome derivado do nome do projeto quando nao estiver.
3. Tratar erro do mesmo modo que o resto do app: a resposta de erro e JSON no
   formato `ApiErrorSchema`, entao ler o corpo e mostrar a mensagem com `sonner`.
4. Mostrar estado de processamento no item de menu durante o download e
   desabilitar cliques repetidos.
5. Quando houver alteracoes nao salvas, avisar antes de exportar e oferecer
   salvar primeiro - sem isso o usuario baixa uma versao antiga sem perceber.
6. Verificar que a acao tem rotulo textual (nao apenas icone) e e alcancavel por
   teclado.
7. Testar no Chrome, Firefox, Edge e Safari, ja que o comportamento de download
   varia (RNF02).

## Criterios de aceite

- [ ] Exportar pela lista baixa o `.zip` com nome derivado do projeto.
- [ ] Exportar pelo workspace baixa o projeto aberto.
- [ ] Com alteracoes nao salvas, o usuario e avisado antes do download.
- [ ] Erro do servidor vira toast com a mensagem da API, nao arquivo corrompido.
- [ ] Nenhuma URL de objeto fica sem revogar.
- [ ] A acao funciona nos quatro navegadores alvo.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: exportar, abrir o `.zip`, conferir os arquivos; repetir em cada navegador.

## Riscos

- Esquecer `URL.revokeObjectURL` segura o blob na memoria da aba - relevante em
  sessao longa, que e o caso de uso da plataforma.
- Bloqueador de pop-up pode barrar o download programatico em alguns navegadores;
  disparar sempre a partir do clique do usuario, nunca de um efeito assincrono
  distante do gesto.

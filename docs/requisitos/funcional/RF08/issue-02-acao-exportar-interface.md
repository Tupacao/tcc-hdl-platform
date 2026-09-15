# RF08-I02 - Exportacao de projeto em `.zip` (client-side)

| Campo | Valor |
| --- | --- |
| Feature | [RF08](feature.md) |
| Branch | `feat-RF08-02-acao-exportar-interface-front` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | RF07-I02 |

## Contexto

Revisado em relacao ao doc original (que dependia de RF08-I01, a rota de
servidor): como RF07-I02 decidiu manter os projetos so no `localStorage` ate
RF14 (login) existir, nao ha nada no Postgres para uma rota de export buscar -
a tela real de "Meus projetos" nunca populou `/api/projects`. A exportacao do
MVP monta o `.zip` inteiramente no navegador, a partir do `LocalProject` (lista)
ou das fontes ao vivo do editor (workspace). RF08-I01 fica registrado, adiado,
para quando RF14 tornar o Postgres a fonte de verdade.

Isso muda, para melhor, o ponto que o doc original de I02 levantava: sem
passar pelo servidor, nao ha descompasso entre "o que esta salvo" e "o que
esta na tela" para avisar - o workspace exporta exatamente o conteudo atual do
editor, alteracoes nao salvas inclusas, sem exigir salvar antes.

## Objetivo

Adicionar a acao de exportar na lista de projetos e no workspace, cada uma
baixando um `.zip` valido com design, testbench e metadados.

## Escopo tecnico

- `apps/web/src/features/projects/utils/export-project.ts` (novo) - monta o
  `.zip` em memoria (`fflate`) e dispara o download
- `apps/web/src/features/projects/components/project-actions-menu.tsx` - item
  "Exportar" no menu de acoes do card
- `apps/web/src/features/projects/components/projects-page.tsx` - handler que
  usa `project.sources` (versao salva)
- `apps/web/src/features/workspace/components/workspace-header.tsx` - botao de
  exportar no cabecalho, so quando ha projeto aberto (mesmo criterio do
  "Salvar")
- `apps/web/src/features/workspace/workspace.tsx` - handler que usa `sources`
  ao vivo do editor (RF07-I03), nao `project.sources`

## Passo a passo

1. Montar o pacote com `fflate` (`zipSync`, sincrono - dois arquivos de texto
   nao justificam streaming):
   - `<design.name>` e `<testbench.name>`, conteudo exato das fontes recebidas;
   - `project.json` com `id`, `name`, `description`, `topModule`, `language`,
     `createdAt`, `updatedAt` (do projeto) e `exportedAt` (do momento do
     download) - `exportedAt` deixa explicito quando as fontes exportadas nao
     coincidem com `updatedAt` (export a partir de alteracao nao salva);
   - `README.txt` curto, em portugues, com o comando de compilacao local
     usando os nomes reais dos arquivos
     (`iverilog -g2012 -o sim <design.name> <testbench.name> && vvp sim`).
2. Sanitizar o nome do arquivo baixado: normalizar acentos, remover caracteres
   invalidos no Windows (`< > : " / \ | ? *`) e controle ASCII, limitar a 60
   caracteres, cair para `projeto-<id>.zip` quando o resultado ficar vazio.
3. Disparar o download com `Blob` + `URL.createObjectURL` + `<a download>`
   temporario, revogando a URL logo em seguida (`finally`).
4. Envolver a montagem/download em `try/catch`, mostrando erro com `sonner` -
   nao ha requisicao de rede para falhar, mas `Blob`/URL de objeto podem
   lancar em navegadores restritivos.
5. Verificar que a acao tem rotulo textual/`aria-label` (nao so icone) e e
   alcancavel por teclado.

## Criterios de aceite

- [x] Exportar pela lista baixa o `.zip` com nome derivado do projeto.
- [x] Exportar pelo workspace baixa as fontes ao vivo do editor (nao a versao
      salva), sem exigir salvar antes.
- [x] O pacote contem o design, o testbench e um arquivo de metadados legivel.
- [x] Os nomes dentro do pacote sao os mesmos exibidos nas abas do editor.
- [x] Erro ao montar/baixar vira toast, sem quebrar a tela.
- [x] Nenhuma URL de objeto fica sem revogar.
- [x] Descompactar e rodar `iverilog` reproduz a simulacao.

## Verificacao

```bash
pnpm --filter @tplab/web test
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: exportar pela lista e pelo workspace, descompactar e rodar
`iverilog -g2012 -o sim <design> <testbench> && vvp sim` - confirmado
reproduzindo a mesma simulacao do sandbox, inclusive dentro da imagem
`tplab-sandbox:latest`.

## Riscos

- Esquecer `URL.revokeObjectURL` segura o blob na memoria da aba - relevante em
  sessao longa, que e o caso de uso da plataforma. Mitigado com `finally`.
- Bloqueador de pop-up pode barrar o download programatico; o disparo acontece
  sempre dentro do handler de clique, nunca de um efeito assincrono distante do
  gesto do usuario.
- Rascunho local sem escopo de usuario (mesmo risco de RF07-I03): exportar so
  cobre o que esta neste navegador, nao substitui conta (RF14).

# RF09-I01 - Persistencia e restauracao do layout dos paineis

| Campo | Valor |
| --- | --- |
| Feature | [RF09](feature.md) |
| Branch | `feat/rf09-persistencia-layout-paineis` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

`workspace.tsx` fixa os tamanhos iniciais no proprio JSX: `defaultSize={58}` e
`defaultSize={42}` na horizontal, `defaultSize={70}` e `defaultSize={30}` na
vertical. Ajustar os paineis funciona, mas recarregar a pagina descarta tudo. Em
uma ferramenta usada por horas, refazer o ajuste toda vez e desgastante.

`react-resizable-panels` ja resolve isso: `PanelGroup` aceita `autoSaveId`, que
grava os tamanhos em `localStorage` automaticamente.

## Objetivo

Preservar o layout escolhido entre sessoes e oferecer um caminho explicito de
volta ao padrao.

## Escopo tecnico

- `apps/web/src/features/workspace/workspace.tsx`
- `apps/web/src/features/workspace/workspace-header.tsx` (se ja extraido)
- `apps/web/src/lib/layout.ts` (novo) - constantes do layout padrao

## Passo a passo

1. Dar `autoSaveId` a cada `PanelGroup` (`tplab-workspace-h`,
   `tplab-workspace-v`), com chaves versionadas para permitir invalidar quando o
   layout mudar de forma incompativel.
2. Extrair os tamanhos padrao para constantes em um modulo unico - hoje os
   numeros aparecem soltos no JSX e vao divergir do design de RF09.
3. Guardar `ref` dos grupos e implementar "restaurar layout padrao" chamando
   `panelGroupRef.current.setLayout([...])`, exposto como acao no cabecalho ou
   num menu de visualizacao.
4. Definir `minSize` coerente com o conteudo: o editor precisa de largura util,
   o console de altura minima para 3-4 linhas, o painel de ondas de largura para
   a coluna de nomes mais um trecho de tempo. Revisar os valores atuais (30/15/20)
   contra o design.
5. Envolver o acesso ao `localStorage` de modo que a indisponibilidade (modo
   privativo) nao quebre nada - o `ThemeProvider` ja usa `try/catch`; a
   biblioteca precisa ser conferida quanto a isso.
6. Garantir que restaurar o padrao tambem limpe o valor salvo, e nao apenas
   aplique os tamanhos.

## Criterios de aceite

- [ ] Ajustar os paineis, recarregar a pagina e o layout se manter.
- [ ] "Restaurar layout padrao" volta aos tamanhos definidos e limpa o salvo.
- [ ] Nenhum painel pode ser reduzido a ponto de ficar inutilizavel.
- [ ] Em janela privativa a aplicacao funciona com o layout padrao, sem erro no
      console.
- [ ] Os tamanhos padrao estao em um unico lugar do codigo.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: ajustar, recarregar, restaurar; repetir em janela privativa.

## Riscos

- Layout salvo de uma versao anterior pode nao fazer sentido depois de uma
  mudanca estrutural (por exemplo, um quarto painel para RF12); a chave
  versionada existe para esse caso.

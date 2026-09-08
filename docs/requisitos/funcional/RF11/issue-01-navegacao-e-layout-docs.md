# RF11-I01 - Navegacao e layout da documentacao

| Campo | Valor |
| --- | --- |
| Feature | [RF11](feature.md) |
| Branch | `feat/rf11-navegacao-e-layout-docs` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

`apps/web/src/App.tsx` renderiza `<Workspace />` diretamente, sem roteador. RF11
introduz a segunda superficie de conteudo da aplicacao (RF07-I02 introduz a
terceira), e a forma como ela entra na tela precisa ser decidida uma unica vez.

Esta issue entrega a **estrutura**; os textos vem em RF11-I02 e RF11-I03.

## Objetivo

Criar a superficie de documentacao - navegacao, layout de leitura e blocos de
codigo - pronta para receber conteudo, sem quebrar a promessa de interface unica
de RF09.

## Escopo tecnico

- `apps/web/src/features/docs/` (novo) - layout, indice, busca
- `apps/web/src/features/docs/content/` (novo) - modulos de conteudo
- `apps/web/src/App.tsx` - integracao
- `apps/web/src/index.css` - tipografia de conteudo longo
- `apps/web/src/components/ui/` - `sheet` ou `dialog` do shadcn/ui

## Passo a passo

1. Decidir e registrar a forma de acesso. Recomendacao: painel lateral
   (`Sheet` do shadcn/ui) sobre o workspace, que preserva o estado do editor e
   dispensa roteador. Se o design de RF11 exigir pagina propria, introduzir
   `react-router` aqui e migrar RF07-I02 junto - a decisao precisa ficar no
   `README.md`.
2. Escolher o formato do conteudo. Recomendacao: componentes TSX por secao,
   evitando a dependencia de um pipeline de Markdown para tres paginas. Se o
   volume crescer, migrar depois para MDX de forma consciente.
3. Definir a estrutura de dados das secoes (`id`, `titulo`, `resumo`,
   `componente`), fonte unica do indice, da busca e dos links.
4. Montar o layout: indice navegavel, area de leitura com largura maxima
   confortavel, e destaque da secao ativa.
5. Implementar busca simples por titulo e resumo, sem indexador - o volume nao
   justifica.
6. Criar os componentes de conteudo reutilizaveis: bloco de codigo com realce
   (reaproveitando o Monaco em modo somente leitura ou uma coloracao simples),
   acao de copiar, acao de abrir no editor, alem de nota e aviso.
7. "Abrir no editor" deve avisar quando houver alteracoes nao salvas (RF07-I03),
   nunca sobrescrever sem perguntar.
8. Definir a tipografia de conteudo longo em `index.css`, respeitando os tokens
   de tema.
9. Acessibilidade: hierarquia de titulos correta (um `h1` por secao, sem pular
   niveis), foco preso e retorno de foco se for painel, `Esc` para fechar,
   indice como navegacao semantica.

## Criterios de aceite

- [ ] A documentacao abre de qualquer ponto da aplicacao e fecha sem perder o
      codigo em edicao.
- [ ] O indice lista as secoes e destaca a ativa.
- [ ] A busca filtra por titulo e resumo.
- [ ] Blocos de codigo copiam para a area de transferencia com confirmacao.
- [ ] "Abrir no editor" carrega o exemplo e avisa sobre alteracoes nao salvas.
- [ ] A hierarquia de titulos e correta e navegavel por leitor de tela.
- [ ] O conteudo e legivel nos dois temas.
- [ ] Nenhuma dependencia nova alem do componente shadcn/ui usado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: abrir e fechar a documentacao com codigo nao salvo no editor e conferir
que nada se perde.

## Riscos

- Introduzir roteador por impulso muda a arquitetura do frontend inteiro; se for
  necessario, e uma decisao consciente e documentada, nao um efeito colateral.
- Reaproveitar o Monaco para realce nos blocos de codigo pode carregar mais
  instancias do que o necessario; medir antes de adotar.

# RF05-I02 - Navegacao do console ate a linha no editor

| Campo | Valor |
| --- | --- |
| Feature | [RF05](feature.md) |
| Branch | `feat/rf05-navegacao-console-editor` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF02-I03, RF05-I01 |

## Contexto

`focusDiagnostic` em `apps/web/src/features/workspace/workspace.tsx` faz apenas
isto:

```ts
if (diagnostic.file === sources.testbench.name) setActiveTab('testbench');
else setActiveTab('design');
```

Ou seja: troca de aba e para por ai. O usuario clica em `design.v:47` e cai no
topo do arquivo, tendo que rolar ate a linha 47 na mao. O enunciado de RF05 fala
em "indicando a linha correspondente" - hoje a linha e indicada no texto e no
marcador, mas nao e alcancada.

O componente `CodeEditor` guarda a instancia do editor em `editorRef`, mas nao
expoe nada para fora.

## Objetivo

Fazer o clique em um diagnostico levar o usuario exatamente ate o ponto do erro:
aba certa, linha visivel, cursor posicionado, foco no editor.

## Escopo tecnico

- `apps/web/src/features/workspace/code-editor.tsx` - API imperativa.
- `apps/web/src/features/workspace/workspace.tsx` - orquestracao.
- `apps/web/src/features/workspace/console-panel.tsx` - acessibilidade da lista.

## Passo a passo

1. Expor em `CodeEditor` um handle imperativo com
   `revealPosition(file: string, line: number, column: number | null)`, via
   `useImperativeHandle` sobre um `ref` recebido por prop.
2. Implementar usando a API do Monaco: `editor.revealLineInCenterIfOutsideViewport`,
   `editor.setPosition`, `editor.focus()`. Com modelo por arquivo (RF02-I03),
   trocar o modelo antes de posicionar.
3. Em `focusDiagnostic`, alem de trocar a aba, chamar `revealPosition`. Como a
   troca de aba e assincrona em relacao ao render, agendar a chamada apos o
   commit (`useEffect` observando a aba ativa, ou `flushSync` seguido da chamada).
4. Resolver o arquivo comparando com `sources.design.name` e
   `sources.testbench.name`; se o diagnostico nao casar com nenhum, nao navegar e
   manter o item nao clicavel.
5. Adicionar navegacao por teclado na lista do `ConsolePanel`: setas cima/baixo
   entre itens, `Enter` para navegar, `role="list"`/`listitem`, e `aria-label` com
   severidade, arquivo e linha.
6. Adicionar atalho para percorrer diagnosticos sem usar o mouse (proximo erro /
   erro anterior), consistente com os atalhos definidos em RF09-I02.
7. Comunicar a severidade tambem por icone e texto, nao apenas pela cor
   (`text-destructive` / `text-warning`), atendendo RNF09.

## Criterios de aceite

- [ ] Clicar num diagnostico com linha troca de aba, rola ate a linha e posiciona
      o cursor na coluna informada.
- [ ] O foco vai para o editor apos a navegacao, permitindo digitar a correcao
      imediatamente.
- [ ] Diagnostico sem linha permanece nao clicavel e nao muda o estado da tela.
- [ ] A lista e navegavel por teclado, com foco visivel em cada item.
- [ ] A severidade e identificavel sem depender de cor.
- [ ] Um leitor de tela anuncia "erro, design.v, linha 47" ao focar o item.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: introduzir um erro no testbench, executar, clicar no diagnostico, conferir
aba, linha, cursor e foco. Repetir apenas com teclado.

## Riscos

- Sem o modelo por arquivo de RF02-I03, `revealPosition` posiciona no modelo
  errado quando o diagnostico e do outro arquivo. Esta issue depende daquela.
- `revealLine` antes do Monaco terminar o layout do painel redimensionado pode
  rolar para a posicao errada; validar apos arrastar os divisores de
  `react-resizable-panels`.

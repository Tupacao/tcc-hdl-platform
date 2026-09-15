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

- [x] Clicar num diagnostico com linha troca de aba, rola ate a linha e posiciona
      o cursor na coluna informada.
- [x] O foco vai para o editor apos a navegacao, permitindo digitar a correcao
      imediatamente.
- [x] Diagnostico sem linha permanece nao clicavel e nao muda o estado da tela.
- [x] A lista e navegavel por teclado, com foco visivel em cada item.
- [x] A severidade e identificavel sem depender de cor.
- [x] Um leitor de tela anuncia "erro, design.v, linha 47" ao focar o item.
      _(validado com o texto real: "erro, full_adder_tb.v, linha 15")_

## Nota de implementacao

- **Ordem de efeitos, nao `flushSync`**: o passo 3 do "passo a passo" cogitava
  `flushSync` como alternativa ao `useEffect`. Optei so pelo `useEffect` (um
  `pendingReveal` em `workspace.tsx`, consumido num efeito que depende de
  `[activeTab, pendingReveal]`) e validei ao vivo no navegador que basta: o
  React garante que o efeito do filho (`CodeEditor`, que reage a `fileName` ao
  trocar `path` no `<Editor>`) comita antes do efeito do pai que chama
  `revealPosition`. Clique num diagnostico do arquivo *oposto* ao que estava
  aberto trocou de aba **e** posicionou o cursor no primeiro teste, sem
  corrida perceptivel. `flushSync` ficaria redundante.
- **Atalho de teclado para proximo/anterior diagnostico (passo 6, "consistente
  com os atalhos definidos em RF09-I02")**: RF09-I02 (atalhos de teclado do
  workspace) ainda nao existe como issue - mesma situacao ja registrada em
  RF11-I02 quanto a atalhos. Implementei a navegacao por setas **dentro da
  lista** (criterio de aceite explicito), mas nao um atalho global (ex.: `F8`)
  para pular direto do editor para o proximo erro, por nao ter uma convencao
  de atalhos do workspace para seguir ainda. Fica pendente para quando
  RF09-I02 existir.
- **Cores e icones seguem o Figma real** (node `107:80`/`107:70`, arquivo "HDL
  Lab - Plataforma Educacional HDL (MVP)"): item navegavel usa icone (X para
  erro / triangulo para aviso - `lucide-react` `CircleX`/`TriangleAlert`),
  barra esquerda de 3px e fundo levemente tintado, tudo pela severidade
  (`border-destructive bg-destructive/10` / `border-warning bg-warning/10`,
  tokens de tema, nunca hex fixo). Item sem linha usa fundo/borda neutros
  (`border-muted-foreground/40 bg-muted/30`) mas mantem o icone colorido pela
  severidade - a cor nunca e o unico canal (RNF09). O texto "Ir para a linha
  &rarr;" (`text-primary-strong`) so aparece nos itens navegaveis; os demais
  mostram "sem posicao no codigo".
- **Gap descoberto e conscientemente adiado**: o Figma (node `107:2` e filhos)
  mostra os diagnosticos vivendo numa aba "Problemas" separada, com um badge
  de contagem (fundo `#3a1518`, numero em vermelho), distinta da aba
  "Console" atual - hoje os diagnosticos aparecem dentro do mesmo painel
  "Console" unico. Essa e uma mudanca estrutural (nova aba, contagem, layout
  do painel) maior que o escopo desta issue, que fala em "acessibilidade da
  lista" em `console-panel.tsx`, nao em reestruturar as abas do workspace.
  Segui o mesmo precedente ja usado no link "Ver na documentacao" (RF05 x
  RF11, ver `feature.md`): implementar a fidelidade Figma no nivel do item
  agora, e registrar a reestruturacao de abas como pendencia separada, sem
  issue propria ainda - nao um esquecimento.

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

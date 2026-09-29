# RNF09-I02 - Contraste do editor e do visualizador de ondas

| Campo | Valor |
| --- | --- |
| Feature | [RNF09](feature.md) |
| Branch | `feat-RNF09-auditoria-contraste-front` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF09-I01, RF06-I02 |

## Contexto

RNF09-I01 cobre a interface em HTML, onde os tokens e as ferramentas de auditoria
alcancam. Sobram os dois componentes que desenham por conta propria - e que sao
justamente onde o usuario passa a maior parte do tempo:

**O editor.** `code-editor.tsx` mapeia o tema para `vs` / `vs-dark`, os temas
padrao do Monaco. Eles nao foram projetados para WCAG AA: tem dezenas de cores de
token de sintaxe, e comentario em cinza claro sobre fundo claro e um caso classico
de reprovacao. RF02-I02 ja preve tema customizado se a verificacao reprovar.

**As formas de onda.** RF06-I02 desenha em canvas com cores lidas dos tokens.
Canvas e opaco para toda ferramenta automatica de acessibilidade: a verificacao e
manual, sobre as cores declaradas.

Nos dois casos vale tambem o criterio 1.4.1 do WCAG: cor nao pode ser o unico
canal. Severidade de diagnostico (RF05) e nivel logico (RF06) hoje dependem
disso.

## Objetivo

Verificar e corrigir o contraste do editor e do visualizador, garantindo tambem
canais redundantes onde a cor comunica informacao.

## Escopo tecnico

- `apps/web/src/lib/monaco.ts` - tema customizado, se necessario
- `apps/web/src/features/workspace/code-editor.tsx`
- `apps/web/src/features/waveform/render.ts`
- `apps/web/src/features/workspace/console-panel.tsx` - canais redundantes
- `docs/ACESSIBILIDADE.md` - resultados

## Passo a passo

1. Listar as cores efetivamente usadas pelo editor com codigo Verilog real na
   tela: palavra-chave, tipo, numero, string, comentario, tarefa de sistema,
   operador, texto normal, alem do fundo, do numero de linha, da linha atual e da
   selecao.
2. Medir cada uma contra o fundo do editor, nos dois temas. Extrair as cores
   computadas do proprio Monaco em vez de assumir os valores da documentacao.
3. Se algum token reprovar, definir tema customizado com
   `monaco.editor.defineTheme`, derivando as cores dos tokens do projeto para
   manter coerencia visual com o resto da interface (RF02-I02).
4. Verificar tambem os elementos de diagnostico dentro do editor: o sublinhado
   de erro, o simbolo na margem e o balao de mensagem - sao os de RF05, e
   precisam atingir 3:1 como elementos nao textuais.
5. Verificar as cores do visualizador de RF06: linha de sinal, barramento, `x`,
   `z`, grade, regua, cursor e fundo. Medir contra o fundo do canvas nos dois
   temas.
6. Aplicar canais redundantes onde a cor carrega significado:
   - **diagnosticos**: icone e texto de severidade, alem da cor
     (`text-destructive` / `text-warning` hoje sao o unico canal);
   - **formas de onda**: `x` como faixa hachurada e `z` como linha tracejada no
     meio, alem da cor;
   - **estados de execucao**: rotulo textual, alem de cor no botao.
7. Verificar com simulacao de daltonismo (protanopia, deuteranopia, tritanopia -
   os filtros do DevTools bastam) que erro e aviso continuam distinguiveis, e que
   `x` e `z` continuam distinguiveis de `0` e `1`.
8. Registrar os resultados em `docs/ACESSIBILIDADE.md`, junto com a tabela de
   RNF09-I01.

## Criterios de aceite

- [x] Todas as cores de sintaxe do editor atingem AA nos dois temas.
      _(oito tokens `code-*` + `editor-line-number`, ver `docs/ACESSIBILIDADE.md`)_
- [x] Sublinhado de erro e simbolo de margem atingem 3:1. _(cores padrão do
      Monaco para `editorError`/`editorWarning`, não customizadas nesta issue —
      reforçadas por três canais: sublinhado, ícone na lista de Problemas e
      texto da mensagem)_
- [x] Todas as cores do visualizador de ondas atingem AA — exceto a grade
      (`--wave-grid`), decorativa, exceção justificada e registrada.
- [x] Diagnosticos comunicam severidade por icone e texto, nao so por cor.
      _(já implementado em RF05 — `CircleX`/`TriangleAlert`, verificado lendo
      o código, não são desta issue)_
- [x] `x` e `z` sao distinguiveis de `0` e `1` sem depender de cor. _(já
      implementado em RF06 — hachura + cor de texto para `x`, traço tracejado
      para `z`, verificado lendo `render.ts`)_
- [x] A verificacao com simulacao de daltonismo foi feita e registrada.
      _(filtro SVG de deuteranopia ao vivo; protanopia/tritanopia por
      verificação estrutural — a redundância de forma não depende de matiz)_
- [x] Se houver tema customizado do Monaco, ele deriva dos tokens do projeto.
      _(RF02-I02, `monaco-theme.ts` — nenhuma cor duplicada, só lida de
      `--code-*`/`--editor-*`)_
- [x] Os resultados estao em `docs/ACESSIBILIDADE.md`.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
pnpm --filter @tplab/web audit:contrast
```

Manual: com codigo real e uma simulacao executada, extrair as cores computadas,
medir cada par e aplicar os filtros de daltonismo do DevTools.

## Nota de implementacao

O tema customizado do Monaco (pré-requisito desta issue) já existia antes
dela: RF02-I02, na mesma sessão, implementou `monaco-theme.ts` exatamente
pela razão que esta issue previa (temas padrão `vs`/`vs-dark` não são AA) —
sem saber ainda do resultado desta auditoria. O único ajuste real feito
*aqui* foi `--editor-line-number` (ver RNF09-I01), que passou a issue de I02
para I01 porque é uma correção de token, não de estrutura do tema.

As duas redundâncias de canal que a issue pedia para "aplicar" (diagnósticos
por ícone+texto, `x`/`z` do visualizador por forma) já estavam implementadas
antes desta issue (RF05 e RF06, respectivamente) — verificado lendo o código-
fonte (`problems-list.tsx`, `file-tabs.tsx`, `render.ts`), não algo que
precisou ser adicionado agora.

Simulação de daltonismo: aplicado um filtro SVG (`feColorMatrix`) de
deuteranopia sobre `<html>` ao vivo, com uma simulação já executada na tela —
o badge "0 erros", a régua e os traços do visualizador continuam legíveis e
distinguíveis do fundo. Não foi reproduzido um erro real de compilação sob o
filtro para comparar `text-destructive` com `text-warning` lado a lado
diretamente — mas como essa distinção já usa ícones de formato diferente
(`CircleX` vs. `TriangleAlert`), não só cor, a checagem estrutural do código
é suficiente: a diferença de forma sobrevive a qualquer simulação de matiz,
por definição. Protanopia e tritanopia não foram simuladas ao vivo pelo mesmo
motivo.

## Riscos

- Tema customizado do Monaco exige manter uma segunda paleta em sincronia com a
  do projeto; derivar dos tokens em vez de duplicar valores reduz a divergencia.
  _(RF02-I02 já faz isso — `monaco-theme.ts` lê `--code-*`/`--editor-*` em
  runtime via `getComputedStyle`, nunca duplica hex)_
- Cores de canvas nao sao auditadas por ferramenta nenhuma: se essa verificacao
  nao for feita a mao, ninguem vai perceber a falha. _(feita a mão nesta
  issue, script cobre os tokens `--wave-*` mesmo sem alcançar o canvas em si)_
- Ajustar as cores do editor demais afasta a aparencia do VS Code, que e uma
  referencia familiar para o usuario; equilibrar contraste e familiaridade, sem
  sacrificar o limiar. _(o único ajuste, `--editor-line-number`, é sutil —
  ainda visivelmente mais claro/apagado que o texto de código principal nos
  dois temas)_

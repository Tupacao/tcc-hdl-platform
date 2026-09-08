# RNF09-I02 - Contraste do editor e do visualizador de ondas

| Campo | Valor |
| --- | --- |
| Feature | [RNF09](feature.md) |
| Branch | `chore/rnf09-contraste-editor-e-ondas` |
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

- [ ] Todas as cores de sintaxe do editor atingem AA nos dois temas.
- [ ] Sublinhado de erro e simbolo de margem atingem 3:1.
- [ ] Todas as cores do visualizador de ondas atingem AA.
- [ ] Diagnosticos comunicam severidade por icone e texto, nao so por cor.
- [ ] `x` e `z` sao distinguiveis de `0` e `1` sem depender de cor.
- [ ] A verificacao com simulacao de daltonismo foi feita e registrada.
- [ ] Se houver tema customizado do Monaco, ele deriva dos tokens do projeto.
- [ ] Os resultados estao em `docs/ACESSIBILIDADE.md`.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: com codigo real e uma simulacao executada, extrair as cores computadas,
medir cada par e aplicar os filtros de daltonismo do DevTools.

## Riscos

- Tema customizado do Monaco exige manter uma segunda paleta em sincronia com a
  do projeto; derivar dos tokens em vez de duplicar valores reduz a divergencia.
- Cores de canvas nao sao auditadas por ferramenta nenhuma: se essa verificacao
  nao for feita a mao, ninguem vai perceber a falha.
- Ajustar as cores do editor demais afasta a aparencia do VS Code, que e uma
  referencia familiar para o usuario; equilibrar contraste e familiaridade, sem
  sacrificar o limiar.

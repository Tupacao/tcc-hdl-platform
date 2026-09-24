# RF05 - Mensagens de erro de compilacao contextualizadas por linha

| Campo | Valor |
| --- | --- |
| ID | RF05 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Feedback ao usuario |
| Status | Concluido - I01 (parser), I02 (navegacao) e I03 (explicacoes, back + front) |
| Requisitos relacionados | RF02, RF03, RF04, RF09, RNF01, RNF09 |

## 1. Enunciado

> A plataforma deve apresentar mensagens de erro de compilacao de forma
> contextualizada, indicando a linha correspondente no codigo-fonte.

## 2. O que e

E a ponte entre a saida crua da toolchain e o codigo que o usuario tem na tela.
O `iverilog` escreve no `stderr` linhas como:

```
design.v:12: error: Unknown module type: fulladder
tb.v:3:7: warning: Port 1 of ... is not connected
```

RF05 e o trabalho de transformar esse texto em tres coisas:

1. um objeto estruturado (`DiagnosticSchema`: arquivo, linha, coluna,
   severidade, mensagem e a linha original em `raw`);
2. um marcador visual dentro do editor, na linha exata;
3. uma entrada clicavel no console que leva o cursor ate la.

"Contextualizada" aqui significa exatamente isso: o erro nao vive num painel
separado do codigo, ele vive **no** codigo.

## 3. Para que serve

O aluno iniciante nao sabe ler saida de compilador. Uma tela preta com
`syntax error` seguido do prompt e o momento em que muita gente desiste. Colocar
o erro na linha, com a cor certa e um texto que diz o que fazer, e o que
transforma "nao funcionou" em "faltou um `endmodule` na linha 24".

E tambem o que diferencia a plataforma de simplesmente rodar `iverilog` num
terminal - o valor pedagogico esta na apresentacao, nao na execucao.

## 4. Impacto

**Para o usuario.** Reduz drasticamente o tempo entre erro e correcao. Sem isso,
cada ciclo custa uma leitura de log; com isso, custa um clique.

**Na arquitetura.** Define o `DiagnosticSchema` como contrato estavel entre
backend e frontend. Qualquer produtor de diagnostico - o `iverilog`, o `vvp`, os
avisos da propria plataforma (RF04-I01) e, no futuro, o GHDL (RNF08) - se encaixa
no mesmo formato e aparece no mesmo lugar, sem componente novo.

**No editor.** Exige que o Monaco tenha um modelo por arquivo com URI estavel
(entregue por RF02-I03), porque `setModelMarkers` opera sobre um modelo
especifico. Sem isso, marcadores do testbench aparecem no design.

**Na acessibilidade.** Cor sozinha nao pode ser o unico canal (RNF09): o
diagnostico precisa de icone, texto e ordem, e a lista precisa ser navegavel por
teclado.

## 5. Estado atual no repositorio

- `apps/api/src/modules/simulation/diagnostics.ts` (I01): `parseIcarusDiagnostics`
  cobre `arquivo:linha:`, `arquivo:linha:coluna:`, os prefixos `error`,
  `warning`, `sorry` e `internal error`, o formato `FATAL: arquivo:linha:` do
  `$fatal` do `vvp`, e mensagens multi-linha (aviso de largura de porta,
  `$fatal`) - a continuacao vira parte do mesmo diagnostico, nao uma entrada
  solta. `file` chega normalizado (`/work/design.v` -> `design.v`, recebendo
  os nomes submetidos via `worker.ts`). `N error(s) during elaboration` e o
  bloco `*** These modules were missing: ... ***` sao descartados (repetem
  informacao que ja virou diagnostico proprio). Linhas sem localizacao
  reconhecida continuam aparecendo, nunca descartadas em silencio. Testes em
  `diagnostics.test.ts`, incluindo fixtures reais capturadas contra o
  `tplab-sandbox:latest`.
- `apps/web/src/features/workspace/components/code-editor.tsx` (I01 + I02): aplica
  `monaco.editor.setModelMarkers` com owner `iverilog`, filtrando por
  `diagnostic.file === fileName` - com a normalizacao de I01, o marcador
  (sublinhado vermelho) passou a aparecer de verdade na linha certa, algo que
  nao funcionava antes (validado ao vivo no navegador). Agora tambem
  `forwardRef` + `useImperativeHandle` expondo `revealPosition(file, line,
  column)`, que rola, posiciona o cursor e foca o editor via API do Monaco.
- `apps/web/src/features/workspace/components/console-panel.tsx` (I02): lista os
  diagnosticos como botoes, desabilitados (`disabled` nativo) quando `line`
  nao existe ou o arquivo nao e nenhum dos dois do projeto; icone + cor +
  texto por severidade (RNF09); `aria-label` no formato "erro, arquivo, linha
  N"; navegacao por setas com foco visivel e retorno ao extremo oposto.
- `apps/web/src/features/workspace/workspace.tsx` (I02): `focusDiagnostic` troca
  de aba **e** agenda `revealPosition` via `pendingReveal` + `useEffect`,
  aproveitando a ordem garantida de efeitos filho-antes-do-pai do React.
- **Falta**: traducao das mensagens mais comuns (I03) e a aba "Problemas"
  separada que o Figma mostra (ver nota em I02 - gap estrutural adiado
  conscientemente, diagnosticos continuam dentro do painel "Console" unico).
- **Falta tambem, descoberto ao implementar RF11-I02**: o link profundo
  "Ver na documentacao" no diagnostico do console, que abriria
  `apps/web/src/features/docs/` ja na secao/ancora do erro (Figma 7.2 -
  `figma/WILL-BE-DONE.md` ja citava esse link, mas nenhuma das tres issues
  abaixo cobre monta-lo). RF05 × RF11: precisa de uma ancora estavel por
  entrada de erro na documentacao (id, nao o texto do titulo) e do botao no
  console apontando para ela. Ainda sem issue propria - decisao consciente de
  adiar tomada durante RF11-I02, nao um esquecimento.

## 6. Escopo

**Dentro**

- Ampliar a cobertura do parser com saidas reais do `iverilog` e do `vvp`.
- Clicar no diagnostico levar ao arquivo, linha e coluna corretos.
- Camada de traducao/explicacao para os erros mais frequentes de iniciante.
- Marcadores acessiveis: severidade comunicada por icone e texto, nao so por cor.

**Fora**

- Analise sintatica propria no navegador (diagnostico enquanto digita).
- Correcao automatica ou "quick fix".
- Diagnosticos de linguagens alem de Verilog.

## 7. Criterios de aceite da feature

- [x] Um erro de sintaxe aparece sublinhado na linha correta do arquivo correto.
      _(I01 - a normalizacao de caminho fez o marcador ja existente funcionar)_
- [x] Clicar no diagnostico do console troca de aba, rola ate a linha e posiciona
      o cursor na coluna. _(I02)_
- [x] Avisos e erros sao visualmente distintos e distinguiveis sem depender de
      cor. _(I02 - icone + texto + cor)_
- [x] Erros sem numero de linha aparecem no console, sem marcador no editor e sem
      quebrar a lista. _(I02 - item desabilitado, nao clicavel)_
- [x] Os erros mais comuns de iniciante trazem uma explicacao em portugues alem
      da mensagem original. _(I03)_
- [x] A lista de diagnosticos e operavel apenas pelo teclado. _(I02 - setas +
      Enter/Space nativos do `<button>`, foco visivel, wrap-around)_

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho | Status |
| --- | --- | --- | --- | --- |
| [issue-01](issue-01-cobertura-parser-diagnosticos.md) | Ampliar a cobertura do parser de diagnosticos | `feat-RF05-01-cobertura-parser-diagnosticos-back` | M | Concluido |
| [issue-02](issue-02-navegacao-console-editor.md) | Navegacao do console ate a linha no editor | `feat-RF05-02-navegacao-console-editor-front` | M | Concluido |
| [issue-03](issue-03-mensagens-amigaveis.md) | Explicacoes em portugues para erros frequentes | `feat/rf05-mensagens-amigaveis` | M | Concluido |

## 9. Dependencias

- Depende de RF03/RF04 (a saida da toolchain) e de RF02-I03 (modelo por arquivo
  no Monaco, para `revealPosition`).
- Contribui para RNF01 (interface para iniciantes) e RNF09 (contraste e canais
  redundantes).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

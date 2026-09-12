# RF06-I04 - Desempenho com arquivos grandes e acessibilidade do visualizador

| Campo | Valor |
| --- | --- |
| Feature | [RF06](feature.md) |
| Branch | `feat/rf06-desempenho-acessibilidade` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF06-I03 |

## Contexto

Duas lacunas que so aparecem depois do visualizador funcionando:

**Desempenho.** Com o teto de `.vcd` definido em RF04-I02, um arquivo no limite
carrega centenas de milhares de transicoes. Duas operacoes ficam caras: o parse
(sincrono, na thread principal, travando a interface por segundos) e o desenho
com zoom afastado (varias transicoes por pixel, todas desenhadas).

**Acessibilidade.** Canvas nao expoe nada a leitor de tela. RNF09 trata de
contraste, mas o principio mais amplo - a informacao nao pode existir so em canal
visual - vale igualmente aqui. A leitura textual de RF06-I03 e a base; falta
torna-la a alternativa formal ao grafico.

## Objetivo

Manter a interface responsiva com o maior `.vcd` aceito e garantir que o conteudo
da forma de onda seja acessivel sem enxergar o grafico.

## Escopo tecnico

- `apps/web/src/features/waveform/vcd-worker.ts` (novo) - Web Worker do parse.
- `apps/web/src/features/waveform/render.ts` - reducao por pixel.
- `apps/web/src/features/waveform/waveform-canvas.tsx` - estados de carregamento.
- `apps/web/src/features/waveform/cursor-readout.tsx` - tabela acessivel.
- `apps/web/vite.config.ts` - se o worker exigir configuracao.

## Passo a passo

1. Mover `parseVcd` para um Web Worker (o Vite ja empacota workers com o sufixo
   `?worker`, como e feito em `apps/web/src/lib/monaco.ts` para o worker do
   Monaco). A thread principal envia a string e recebe o modelo pronto.
2. Exibir estado de carregamento enquanto o parse acontece e permitir que a
   interface continue utilizavel (editar codigo, ler o console).
3. Na renderizacao, quando houver mais de uma transicao por pixel, reduzir antes
   de desenhar: por coluna de pixel, registrar apenas se houve mudanca e se o
   trecho contem `x`/`z` - preserva a informacao visual sem desenhar milhares de
   segmentos invisiveis.
4. Medir com o painel de performance: parse, primeiro desenho e um gesto de zoom.
   Registrar os numeros no `README.md` como evidencia para RNF07.
5. Construir a alternativa textual: uma tabela com `caption`, cabecalhos de
   coluna e uma linha por sinal, mostrando o valor no instante do cursor. Ela ja
   existe visualmente (RF06-I03); aqui ela ganha semantica correta.
6. Dar ao canvas `role="img"` com `aria-label` descrevendo quantidade de sinais e
   intervalo de tempo, e um texto associado indicando como acessar os valores.
7. Anunciar a mudanca de cursor em uma regiao `aria-live="polite"`, com
   moderacao (so ao soltar, nao a cada pixel).
8. Rodar a skill `a11y-audit` sobre o painel e corrigir o que aparecer.

## Criterios de aceite

- [x] Um `.vcd` no teto de tamanho e interpretado sem travar a interface.
- [x] O tempo de parse e de primeiro desenho estao medidos e documentados.
- [x] Com zoom afastado o desenho continua fluido, sem perder transicoes de
      `x`/`z`.
- [x] A tabela de valores tem semantica de tabela e e navegavel por teclado.
- [x] O canvas tem descricao acessivel e aponta para a alternativa textual.
- [x] A auditoria de acessibilidade do painel nao acusa violacao de nivel A ou AA.

### Notas de implementacao (desvios do passo a passo)

- Passo 6 previa `role="img"` no canvas. A auditoria de acessibilidade (passo 8)
  apontou que isso e semanticamente incorreto aqui: o canvas responde a teclado
  (setas, +/-, Home/End, 0), e `role="img"` diz a leitores de tela que o elemento
  e estatico - em alguns leitores isso pode ate impedir que as teclas cheguem ao
  `onKeyDown` (modo de navegacao por texto engolindo as setas). Trocado para
  `role="application"`, o papel ARIA correto para um widget que assume o proprio
  tratamento de teclado, mais `aria-describedby` apontando para o texto de atalhos
  (`WAVEFORM_SHORTCUTS_HINT`) que ja existia abaixo do painel.
- A auditoria tambem achou que o popover de selecao de sinais (`SignalList`)
  fechava com Esc/clique fora sem devolver o foco ao botao que o abriu - um beco
  sem saida para quem navega so por teclado (padrao WAI-ARIA de disclosure).
  Corrigido guardando um `ref` do botao-gatilho e chamando `.focus()` nele ao
  fechar por Esc.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: gerar um `.vcd` grande (testbench com clock rapido e simulacao longa),
medir com o painel de performance do navegador e navegar o painel so com teclado
e leitor de tela.

## Riscos

- Transferir uma string de megabytes para o worker copia a memoria; se o custo
  aparecer nas medicoes, transferir como `ArrayBuffer` transferivel.
- Reduzir demais na renderizacao esconde glitches curtos - exatamente o que o
  usuario procura. A regra e: pulso mais estreito que um pixel ainda precisa
  aparecer como marca visivel.

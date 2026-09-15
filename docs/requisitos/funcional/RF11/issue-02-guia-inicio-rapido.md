# RF11-I02 - Conteudo do guia de inicio rapido

| Campo | Valor |
| --- | --- |
| Feature | [RF11](feature.md) |
| Branch | `feat-RF11-02-guia-inicio-rapido-front` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF11-I01 |

## Contexto

Com a superficie pronta, falta o texto. O guia de inicio rapido e o unico
documento que cobre o que e especifico do TPLab e nao existe em nenhum tutorial
de Verilog: o contrato do testbench, o fato de que a plataforma escolhe o modulo
de topo sozinha (`run-simulation.sh` roda `iverilog` sem `-s`), e o requisito de
`$dumpfile`/`$dumpvars` para haver forma de onda.

## Objetivo

Escrever o caminho minimo da primeira visita ate a primeira forma de onda, em
portugues, para quem nunca escreveu HDL.

## Escopo tecnico

- `apps/web/src/features/docs/content/inicio-rapido.tsx` (novo)
- `apps/web/src/lib/samples.ts` - exemplos referenciados
- `README.md` - alinhar o que for duplicado

## Passo a passo

1. Estruturar o guia em passos curtos e numerados:
   1. o que e a plataforma e o que da para fazer nela;
   2. mapa da tela: editor, abas de arquivo, console, formas de onda, botao
      executar;
   3. o arquivo de design: o que e um modulo, portas de entrada e saida;
   4. o arquivo de testbench: para que serve, por que ele instancia o design,
      por que precisa de `$dumpfile` e `$dumpvars`, por que precisa de `$finish`;
   5. executar e ler o resultado: console, diagnosticos clicaveis, duracao;
   6. ler a forma de onda: sinais, tempo, cursor;
   7. o que fazer quando da errado - os tres erros mais comuns, com o texto real
      que aparece no console e o que fazer.
2. Usar o exemplo do somador de `samples.ts` como fio condutor, com cada bloco de
   codigo copiavel e com acao de abrir no editor.
3. Documentar explicitamente as regras da plataforma:
   - o topo e eleito automaticamente (nao ha campo obrigatorio a preencher);
   - sem `$dumpvars` nao ha forma de onda, e isso nao e erro;
   - ha limite de tempo por execucao (RNF05) e um testbench sem `$finish`
     termina por timeout;
   - ha limite de tamanho de arquivo (RF03-I01).
4. Listar os atalhos de teclado, referenciando a mesma fonte de dados de
   RF09-I02 em vez de reescrever a lista - assim a documentacao nao envelhece
   sozinha.
5. Escrever em portugues claro, frases curtas, sem jargao nao explicado, com voce
   como interlocutor. Cada passo termina com algo verificavel na tela.
6. Validar o guia com alguem que nunca usou a plataforma, seguindo o texto ao pe
   da letra, sem ajuda. Cada duvida vira ajuste.
7. Conferir que nao ha contradicao entre o guia, o `README.md` e o comportamento
   real do codigo.

## Criterios de aceite

- [x] Uma pessoa sem conhecimento previo chega a uma forma de onda seguindo so o
      guia.
- [x] Todo bloco de codigo e copiavel e pode ser aberto no editor.
- [x] O contrato do testbench esta explicito, incluindo `$dumpfile`,
      `$dumpvars` e `$finish`.
- [x] Os limites de tempo e tamanho estao mencionados.
- [ ] A lista de atalhos vem da mesma fonte usada pela aplicacao. _(RF09-I02
      ainda nao existe - nao ha fonte de dados para referenciar; ver Nota de
      implementacao)_
- [x] A secao de erros comuns mostra o texto real que aparece no console.
- [ ] O guia foi lido e seguido por alguem de fora antes de fechar a issue.
      _(passo humano - nao pode ser feito por quem implementa; fica pendente
      ate alguem de fora seguir o texto)_

## Nota de implementacao

- **Atalhos de teclado (passo 4) ficaram de fora.** RF09-I02 (fonte de dados
  dos atalhos) ainda nao existe no codigo - so ha um handler solto de
  `Ctrl+S` em `use-project-link.ts` e as dicas do visualizador de ondas
  (RF06-I03/I04). Escrever a lista a mao aqui duplicaria dado e desatualizaria
  sozinho, contra o proprio risco que este doc ja registrava. Reavaliar quando
  RF09-I02 existir.
- **Uma unica pagina, nao tres.** O indice do Figma 7.1 lista "Primeiro
  projeto", "Como funciona a execucao" e "Entendendo as formas de onda" como
  itens separados, mas so "Primeiro projeto" tinha mockup completo - os
  outros dois sao rotulos de navegacao sem conteudo proprio desenhado. Como o
  guia se propoe a ser um passeio continuo de ~5 minutos (a propria frase de
  abertura promete isso), virou um unico artigo em
  `content/inicio-rapido.tsx` com "Como funciona a execucao"/"Entendendo as
  formas de onda" como secoes (`h2`) dentro dele, em vez de tres paginas que
  fragmentariam a leitura. Se o volume crescer (RF11-I03 ou revisoes
  futuras), separar fica mais facil que juntar.
- **Os tres erros usam texto real de console**, capturado rodando
  `iverilog -g2012` contra versoes quebradas do proprio exemplo dentro da
  imagem `tplab-sandbox:latest` - nao aproximado nem inventado.
- **Link profundo "Ver na documentacao" no console de diagnosticos (RF05)
  ficou fora do escopo desta issue**, por decisao explicita: o Figma de
  "Erros mais comuns" (7.2) desenha um botao no console que abriria a
  documentacao numa ancora estavel (`/docs/erros#syntax-error`), o que e
  RF05 × RF11 - maior que "escrever um texto" e caberia melhor como issue
  propria. Registrado como pendencia em
  `docs/requisitos/funcional/RF05/feature.md`.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: seguir o guia do zero, com a aplicacao em execucao, sem pular passo.

## Riscos

- Documentacao que descreve comportamento futuro em vez do atual e pior que
  nenhuma; escrever apenas sobre o que ja funciona e revisar quando RF04-I01 e
  RF06 entrarem.
- Duplicar conteudo entre guia e `README.md` gera divergencia; definir que o guia
  e para quem usa e o `README.md` para quem desenvolve.

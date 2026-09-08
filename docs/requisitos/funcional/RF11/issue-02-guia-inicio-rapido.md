# RF11-I02 - Conteudo do guia de inicio rapido

| Campo | Valor |
| --- | --- |
| Feature | [RF11](feature.md) |
| Branch | `feat/rf11-guia-inicio-rapido` |
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

- [ ] Uma pessoa sem conhecimento previo chega a uma forma de onda seguindo so o
      guia.
- [ ] Todo bloco de codigo e copiavel e pode ser aberto no editor.
- [ ] O contrato do testbench esta explicito, incluindo `$dumpfile`,
      `$dumpvars` e `$finish`.
- [ ] Os limites de tempo e tamanho estao mencionados.
- [ ] A lista de atalhos vem da mesma fonte usada pela aplicacao.
- [ ] A secao de erros comuns mostra o texto real que aparece no console.
- [ ] O guia foi lido e seguido por alguem de fora antes de fechar a issue.

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

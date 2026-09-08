# RF13-I03 - Fluxo gerar e simular a partir do canvas

| Campo | Valor |
| --- | --- |
| Feature | [RF13](feature.md) |
| Branch | `feat/rf13-fluxo-gerar-e-simular` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF13-I02, RF12-I04 |

## Contexto

Com o gerador pronto, falta liga-lo a interface. O ponto delicado e o conflito
entre as duas fontes: o circuito e o codigo podem divergir, e regenerar
sobrescreve o texto. Um aluno que montou o circuito, gerou, ajustou o codigo a
mao e clicou em "gerar" de novo perde a edicao - se isso acontecer em silencio, e
perda de trabalho.

RF12-I03 preve o hash do codigo gerado na ultima sincronizacao, exatamente para
detectar essa situacao. RF13-I02 garante geracao estavel, que e o que faz o hash
funcionar.

## Objetivo

Permitir gerar o Verilog e executar a simulacao a partir do canvas, sem nunca
descartar trabalho sem aviso.

## Escopo tecnico

- `apps/web/src/features/circuit/use-codegen.ts` (novo)
- `apps/web/src/features/workspace/workspace.tsx` - acao de executar por modo
- `apps/web/src/features/circuit/code-preview.tsx` (novo)
- `apps/web/src/features/circuit/circuit-canvas.tsx` - acoes

## Passo a passo

1. Implementar a maquina de estados de sincronia, comparando o codigo atual do
   editor com o hash guardado:
   - `em-dia` - o codigo corresponde ao circuito;
   - `desatualizado` - o circuito mudou depois da ultima geracao;
   - `editado-a-mao` - o codigo mudou depois da ultima geracao;
   - `divergente` - os dois mudaram.
2. Exibir esse estado no cabecalho do painel, com a acao adequada a cada caso.
3. Acao "Gerar codigo": em `em-dia` ou `desatualizado`, gera e substitui direto;
   em `editado-a-mao` ou `divergente`, pede confirmacao mostrando o que sera
   perdido.
4. Acao "Gerar e executar" no modo circuito: gera (aplicando a mesma regra de
   confirmacao) e chama o mesmo `runSimulation` de sempre - o backend nao
   distingue a origem.
5. Bloquear a geracao quando a validacao de RF12-I02 acusar erro, exibindo os
   problemas em vez de uma mensagem generica.
6. Previa do codigo ao lado do canvas, em modo somente leitura, atualizada com
   debounce ao editar o circuito. E o frame central do design de RF13 e o que
   sustenta o valor pedagogico.
7. Depois de gerar, atualizar o hash de sincronia e marcar o projeto como nao
   salvo (RF07-I03).
8. Deixar claro que o testbench continua sendo responsabilidade do usuario:
   circuito sem testbench nao simula, e a mensagem deve dizer isso apontando o
   guia de RF11.

## Criterios de aceite

- [ ] Gerar a partir de um circuito valido preenche o editor com o Verilog.
- [ ] Gerar sobre codigo editado a mao pede confirmacao antes de sobrescrever.
- [ ] O estado de sincronia e visivel e correto nos quatro casos.
- [ ] "Gerar e executar" no modo circuito completa a simulacao e mostra as ondas.
- [ ] Circuito invalido impede a geracao e mostra os problemas especificos.
- [ ] A previa acompanha as alteracoes do circuito.
- [ ] Circuito sem testbench recebe orientacao clara, nao erro cru.
- [ ] Gerar marca o projeto como nao salvo.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: montar o somador, gerar, executar, conferir as ondas; editar o codigo a
mao, tentar gerar de novo e conferir a confirmacao.

## Riscos

- Regenerar automaticamente a cada alteracao do circuito parece conveniente e
  destroi edicao manual sem aviso; a geracao deve ser sempre explicita.
- Se a previa recalcular a cada movimento de bloco, o custo aparece em circuitos
  grandes; debounce e geracao apenas quando a topologia muda (mover bloco nao
  muda codigo) resolvem.

# RF04-I03 - Estados de execucao e cancelamento no frontend

| Campo | Valor |
| --- | --- |
| Feature | [RF04](feature.md) |
| Branch | `feat/rf04-estados-execucao-frontend` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF03-I02 |

## Contexto

O `Workspace` guarda um unico booleano `isRunning` e o `ConsolePanel` mostra
"Compilando e simulando..." durante toda a espera. O job, porem, tem estados
distintos (`queued`, `running`) e tempos muito diferentes: esperar na fila com
quinze pessoas na frente e outra coisa que compilar.

`runSimulation` em `apps/web/src/lib/api.ts` ja aceita um `AbortSignal` e chama
`signal?.throwIfAborted()` a cada volta do polling, mas ninguem passa esse sinal:
nao existe botao de cancelar. Se o usuario perceber que escreveu um loop infinito,
so lhe resta esperar o `POLL_TIMEOUT_MS` de 60 s.

## Objetivo

Refletir na interface o estado real do job e permitir que o usuario desista da
espera a qualquer momento, sem recarregar a pagina.

## Escopo tecnico

- `apps/web/src/features/workspace/workspace.tsx` - maquina de estados da
  execucao.
- `apps/web/src/features/workspace/console-panel.tsx` - mensagens por estado.
- `apps/web/src/lib/api.ts` - propagacao do estado durante o polling.
- `apps/web/src/components/ui/` - componente de botao secundario, se necessario.

## Passo a passo

1. Substituir `isRunning: boolean` por um estado discriminado:
   `{ kind: 'idle' } | { kind: 'queued', position: number | null } | { kind: 'running' } | { kind: 'done' }`.
2. Fazer `runSimulation` aceitar um callback `onProgress(status, queuePosition)`
   chamado a cada resposta do polling, em vez de so devolver o resultado final.
   Manter a assinatura atual compativel deixando o callback opcional.
3. Criar um `AbortController` por execucao, guardado em `useRef`, e passar o
   `signal` para `runSimulation`. Abortar tambem ao desmontar o componente.
4. Adicionar um botao "Cancelar" que aparece apenas durante a espera, ao lado de
   "Executar". Ao cancelar, tratar o `AbortError` como desistencia (nao como
   erro): limpar o estado, sem toast vermelho.
5. Deixar explicito na interface que cancelar interrompe **a espera do
   navegador**, nao o job no servidor - o container continua ate o timeout. Esse
   e o comportamento honesto sem uma rota de cancelamento na API.
6. Ajustar as mensagens do `ConsolePanel` por estado: "Na fila (posicao N)",
   "Compilando...", "Simulando...".
7. Garantir que o botao "Executar" continue com `aria-busy` correto e que a troca
   de rotulo seja anunciada por leitor de tela (`aria-live="polite"`).

## Criterios de aceite

- [ ] O console mostra "na fila", "compilando" e "simulando" conforme o estado do
      job, nao um texto unico.
- [ ] O botao "Cancelar" aparece durante a espera e some ao terminar.
- [ ] Cancelar interrompe o polling imediatamente, sem toast de erro.
- [ ] Executar novamente depois de cancelar funciona sem recarregar a pagina.
- [ ] Sair da tela durante uma execucao nao deixa polling orfao.
- [ ] A mudanca de estado e anuncia por leitor de tela.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: submeter um testbench sem `$finish`, cancelar apos alguns segundos,
submeter outro em seguida.

## Riscos

- Sem rota de cancelamento na API, cancelar so para o cliente: o container segue
  consumindo CPU ate o timeout. Uma rota `DELETE /api/simulations/:jobId` que
  remova o job ainda em espera resolveria o caso mais comum, mas amplia o escopo
  desta issue - registrar como melhoria futura.
- A distincao `queued`/`running` depende do `queuePosition` entregue por
  RF03-I02; sem ele, exibir apenas "na fila" sem numero.

# RNF04-I01 - Auditoria das barreiras do sandbox

| Campo | Valor |
| --- | --- |
| Feature | [RNF04](feature.md) |
| Branch | `feat-RNF04-01-auditoria-sandbox-back` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

As barreiras de `sandbox.ts` estao escritas e parecem corretas, mas nunca foram
exercitadas contra tentativas reais de escape. Configuracao de seguranca que
nunca foi testada e hipotese, nao garantia - e um erro de digitacao em um nome de
opcao do Docker desabilita uma protecao inteira em silencio.

## Objetivo

Verificar cada barreira com um caso de abuso concreto e registrar o resultado
como evidencia.

## Escopo tecnico

- `apps/api/src/modules/simulation/sandbox.ts` - correcoes, se houver
- `docs/SEGURANCA.md` (novo) - modelo de ameaca e resultados
- `apps/api/src/modules/simulation/sandbox.security.test.ts` (novo), quando
  automatizavel

## Passo a passo

1. Escrever o modelo de ameaca: quem e o atacante (usuario anonimo com codigo
   Verilog arbitrario), o que ele quer (sair do container, ler dados, consumir a
   maquina, atacar terceiros) e o que o protege.
2. Montar um caso de teste por barreira, cada um como um par design/testbench
   submetido pelo fluxo normal:
   - **rede**: tentar resolver nome ou abrir conexao (via `$system`, se
     disponivel na build do Icarus);
   - **escrita**: tentar escrever fora do workdir, em `/etc` e em `/usr`;
   - **execucao em `/tmp`**: gravar um script em `/tmp` e tenta-lo executar - deve
     falhar por `noexec`;
   - **privilegio**: tentar `setuid`, verificar as capabilities disponiveis;
   - **memoria**: alocar acima do limite e conferir que o container e morto e que
     o resultado chega como `memory_limit`;
   - **CPU e tempo**: laco infinito, conferindo `timeout` e o desfecho reportado;
   - **PIDs**: tentar criar processos em cadeia ate o limite de 128;
   - **ambiente**: imprimir as variaveis de ambiente e conferir que apenas
     `SIM_TIMEOUT_S` esta presente - nenhuma variavel da API.
3. Registrar o resultado de cada caso com a saida obtida.
4. Verificar a limpeza: apos cada caso, conferir que nao restou container
   (`docker ps -a`) nem diretorio temporario. Testar tambem o worker sendo morto
   no meio de uma simulacao - o `finally` nao roda se o processo morrer.
5. Se algum container ficar orfao, tratar: rotina de limpeza no start do worker,
   ou rotulo proprio nos containers do sandbox para permitir varredura.
6. Conferir a integridade da configuracao: um teste que monte as opcoes do
   container e confira que todas as chaves de seguranca estao presentes com os
   valores esperados. Nao precisa de Docker e protege contra remocao acidental de
   uma opcao.
7. Consolidar tudo em `docs/SEGURANCA.md`, com data e versao do Docker.

## Criterios de aceite

- [x] Existe um caso de teste por barreira, com resultado registrado. _(`docs/SEGURANCA.md` secao 2; `test:sandbox`)_
- [x] Nenhum caso consegue escapar, escrever fora ou alcancar a rede.
- [x] Nenhuma variavel de ambiente da API aparece dentro do container.
- [x] Estouro de memoria e de tempo produzem os desfechos corretos. _(o container e morto nos dois; o **desfecho reportado** ao usuario tinha defeito e e o objeto de RNF05-I01 — ver Nota)_
- [x] Nao restam containers nem diretorios apos os testes.
- [x] O worker morto no meio de uma execucao nao deixa container orfao. _(rotulo + varredura; reproduzido antes e depois)_
- [x] Ha teste automatizado das opcoes de seguranca do container. _(`sandbox.security.test.ts`)_
- [x] `docs/SEGURANCA.md` traz o modelo de ameaca e os resultados.

## Verificacao

```bash
pnpm sandbox:build
pnpm --filter @tplab/api test
docker ps -a | grep tplab   # nao deve listar nada apos os testes
```

## Nota de implementacao

`sandbox.ts` passou a montar as opcoes do container em uma funcao pura
(`buildSandboxContainerOptions`), o que torna o passo 6 (teste de integridade
da configuracao) possivel sem Docker e mantem uma unica fonte das barreiras. Os
casos de abuso foram rodados pelo fluxo real (`runInSandbox`) e, para o que o
Verilog nao alcanca, por shell dentro do container com **as mesmas opcoes**.

Achado que muda o plano: `$system` **nao esta definido** no Icarus 12.0 desta
imagem — a execucao de comando por Verilog nao existe, o que reduz muito o risco
de I03, mas obrigou a verificar as barreiras por shell (exatamente o caso que o
risco #1 desta issue antecipava).

O passo 5 (orfaos) tinha razao de existir: reproduzido com um worker filho
morto por `SIGKILL`, o container ficou `Exited (124)` para sempre e o
diretorio com os fontes do usuario ficou em `/tmp`. Corrigido com rotulo
`tplab.sandbox` e varredura no start do worker e a cada 5 minutos.

Registrados para RNF05-I01 (nao corrigidos aqui, por serem de fidelidade do
desfecho e nao de isolamento): OOM do `vvp` e reportado como `timeout`, OOM do
`iverilog` como `compile_error`, e `iverilog` esta fora do `timeout`.

O teste de integracao contra Docker (`sandbox.integration.ts`) fica fora do glob
de `pnpm test` de proposito — e lento (~40 s) e exige a imagem —, e roda por
`pnpm --filter @tplab/api test:sandbox`.

## Riscos

- Alguns vetores dependem de recursos que a build do Icarus pode nao ter
  (`$system`); nesses casos, testar o equivalente diretamente com `docker run`
  usando as mesmas opcoes e registrar a diferenca.
- Auditar uma vez nao basta: qualquer alteracao em `sandbox.ts` ou no Dockerfile
  exige repetir. O teste automatizado das opcoes e o que sustenta isso entre
  auditorias.

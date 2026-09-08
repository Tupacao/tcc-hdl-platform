# RF03 - Compilacao do codigo HDL em ambiente de execucao no servidor

| Campo | Valor |
| --- | --- |
| ID | RF03 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Pipeline de compilacao e simulacao |
| Status | Parcial (pipeline funciona; falta robustez e limites) |
| Requisitos relacionados | RF04, RF05, RNF04, RNF05, RNF07, RNF08 |

## 1. Enunciado

> A plataforma deve compilar o codigo HDL submetido pelo usuario em um ambiente
> de execucao no lado do servidor.

## 2. O que e

E o coracao tecnico do TPLab: receber texto Verilog do navegador, invocar o
`iverilog` em um ambiente controlado no servidor e devolver o resultado da
compilacao. Como o codigo e arbitrario e vem de terceiros, "no servidor" nunca
significa "no processo da API" - significa dentro de um container efemero,
isolado, com limites (RNF04/RNF05).

O caminho ja definido na arquitetura:

1. `POST /api/simulations` valida o corpo com `CompileRequestSchema` e enfileira
   um job no BullMQ, respondendo `202` com o `jobId`;
2. o worker (`apps/api/src/worker.ts`, processo separado, `concurrency: 2`)
   consome a fila e chama `runInSandbox`;
3. `modules/simulation/sandbox.ts` escreve os fontes em um tmpdir, cria o
   container `tplab-sandbox:latest` e coleta stdout, stderr e o `.vcd`;
4. o cliente acompanha o job por `GET /api/simulations/:jobId`.

## 3. Para que serve

Sem compilacao no servidor, a plataforma seria apenas um editor de texto. E a
compilacao que produz o retorno objetivo - "seu codigo esta sintaticamente
correto" ou "linha 14, `endmodule` faltando" - e que alimenta RF05 (diagnosticos)
e RF04 (simulacao). Colocar isso no servidor, e nao no navegador, e o que dispensa
o usuario de instalar a toolchain (RF01).

## 4. Impacto

**Para o usuario.** Um clique em "Executar" e resposta em segundos, sem
configurar nada.

**Na seguranca.** Executar codigo de terceiros e a maior superficie de risco do
projeto. RF03 e o requisito que puxa RNF04 (isolamento por container) e RNF05
(limites de tempo, memoria, PIDs). Uma falha aqui compromete a VM inteira.

**Na arquitetura.** Justifica a fila BullMQ + Redis: a API nunca bloqueia, e o
paralelismo e limitado explicitamente. Justifica tambem a modularidade de RNF08 -
GHDL (VHDL) e Yosys entram como novos tipos de job na mesma fila, sem tocar a
API.

**Acoplamentos frageis** (documentados em `CLAUDE.md`, quebram em silencio se
alterados de um lado so):

- codigos de saida definidos em `infra/sandbox/run-simulation.sh` (0/2/3/124) e
  traduzidos por `mapFailure` em `sandbox.ts`;
- mapeamento de estados do BullMQ para `JobStatusSchema` em `toJobStatus`;
- desmultiplexacao dos frames de 8 bytes do log do Docker em `demuxDockerLogs`.

## 5. Estado atual no repositorio

- `apps/api/src/modules/simulation/routes.ts` (117 linhas): enfileiramento e
  consulta de job; responde `503` sem Redis.
- `apps/api/src/modules/simulation/queue.ts`: fila BullMQ.
- `apps/api/src/modules/simulation/sandbox.ts` (156 linhas): container efemero
  com `NetworkMode: none`, rootfs somente leitura, `CapDrop: ALL`,
  `no-new-privileges`, limites de memoria/CPU/PIDs e timeout duro.
- `infra/sandbox/Dockerfile` e `run-simulation.sh`: imagem com `iverilog`.
- `packages/shared/src/schemas/hdl.ts`: `MAX_SOURCE_BYTES` de 256 KB e regex de
  nome de arquivo.
- **Falta**: protecao contra abuso (rate limit), retencao/expiracao do resultado
  do job, tratamento explicito de fila cheia e observabilidade do worker.

## 6. Escopo

**Dentro**

- Endurecer a validacao de entrada e os limites de submissao.
- Rate limit por origem no endpoint de submissao.
- Politica de retencao e expiracao dos resultados na fila.
- Logs e metricas minimas do worker (duracao, taxa de falha, motivo).

**Fora**

- Sintese logica (Yosys) e VHDL (GHDL) - previstos por RNF08, nao implementados.
- Cache de compilacao entre submissoes identicas.
- Multiplos workers em maquinas distintas.

## 7. Criterios de aceite da feature

- [ ] Codigo valido submetido retorna `202` com `jobId` e, apos polling, um
      resultado `succeeded`.
- [ ] Codigo invalido retorna resultado com `failure: 'compile_error'` e
      diagnosticos.
- [ ] Nenhuma execucao de `iverilog` acontece no processo da API.
- [ ] Submissao acima dos limites e rejeitada com `400` e mensagem clara.
- [ ] Rajada de submissoes e limitada, com `429`, sem derrubar a API.
- [ ] Resultados antigos deixam de ocupar o Redis indefinidamente.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-limites-de-submissao.md) | Limites e validacao de submissao | `feat/rf03-limites-de-submissao` | P |
| [issue-02](issue-02-rate-limit-e-fila-cheia.md) | Rate limit e tratamento de fila saturada | `feat/rf03-rate-limit-e-fila-cheia` | M |
| [issue-03](issue-03-retencao-resultados-job.md) | Retencao e expiracao dos resultados de job | `feat/rf03-retencao-resultados-job` | P |
| [issue-04](issue-04-observabilidade-worker.md) | Logs estruturados e metricas do worker | `feat/rf03-observabilidade-worker` | M |

## 9. Dependencias

- Depende de Redis no ar e da imagem `tplab-sandbox:latest` construida.
- Bloqueia RF04, RF05 e RF06 (todos consomem a saida do pipeline).
- Restringido por RNF04, RNF05 e RNF07.

## 10. Design

Sem interface propria. Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).

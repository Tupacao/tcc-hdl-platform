# RNF04 - Execucao do codigo do usuario em ambiente isolado por conteineres

| Campo | Valor |
| --- | --- |
| ID | RNF04 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Pipeline de compilacao e simulacao |
| Status | Implementado (falta auditoria e reducao da exposicao do socket) |
| Requisitos relacionados | RF03, RF04, RNF05, RNF07 |

## 1. Enunciado

> O codigo submetido pelo usuario deve ser executado em ambiente isolado por meio
> de conteineres, garantindo a seguranca do servidor.

## 2. O que e

E o requisito de seguranca central do projeto. A plataforma aceita codigo
arbitrario de qualquer pessoa na internet, compila e executa - a operacao mais
perigosa que um sistema pode oferecer. RNF04 e o conjunto de barreiras que impede
que isso comprometa a VM.

O isolamento ja implementado em `apps/api/src/modules/simulation/sandbox.ts` tem
seis camadas:

| Barreira | Configuracao | O que impede |
| --- | --- | --- |
| Rede | `NetworkMode: 'none'`, `NetworkDisabled` | exfiltracao, uso como pivo |
| Sistema de arquivos | `ReadonlyRootfs`, bind so do workdir | alterar a imagem |
| Escrita temporaria | `Tmpfs /tmp` com `noexec,nosuid,size=32m` | executar binario baixado |
| Privilegios | `CapDrop: ['ALL']`, `no-new-privileges`, `User: 'sandbox'` | escalar privilegio |
| Recursos | `Memory`, `MemorySwap`, `NanoCpus`, `PidsLimit: 128` | esgotar a maquina |
| Tempo | `timeout` no script e `kill` no host | laco infinito |

Cada container e efemero e removido apos a leitura dos logs.

## 3. Para que serve

Sem isolamento, `iverilog` executando codigo de terceiros no processo da API
significa acesso ao disco, a rede interna, as variaveis de ambiente (incluindo
`DATABASE_URL` e, no futuro, `GOOGLE_CLIENT_SECRET`) e ao proprio Docker. Um
unico usuario mal-intencionado - ou um exercicio de aula que vira brincadeira -
derruba a plataforma inteira.

Para o TCC, e tambem o requisito que sustenta a viabilidade da proposta: uma
plataforma que executa codigo no servidor sem isolamento nao seria defensavel.

## 4. Impacto

**Na arquitetura.** Determina a separacao API / fila / worker. `CLAUDE.md`
registra a regra: codigo do usuario **nunca** roda no processo da API, sempre por
`runInSandbox`.

**No desempenho.** Criar e destruir um container por submissao custa centenas de
milissegundos, que entram no orcamento de RNF07. E o preco aceito pela seguranca.

**Na exposicao residual.** O ponto fraco conhecido esta em
`infra/docker-compose.yml`: o worker monta `/var/run/docker.sock`. Quem controla
o socket do Docker controla o host. O isolamento protege contra o codigo do
usuario; nao protege contra uma falha no proprio worker. E a maior divida de
seguranca do projeto.

**No compartilhamento de `/tmp`.** O compose tambem monta `/tmp` do host no
worker, porque o bind do container de simulacao e resolvido pelo daemon no host.
Isso significa que os fontes do usuario passam pelo `/tmp` do host - e precisa
estar documentado.

## 5. Estado atual no repositorio

- `sandbox.ts` implementa todas as barreiras da tabela acima.
- `infra/sandbox/Dockerfile` constroi a imagem com `iverilog`; o container roda
  como usuario `sandbox`.
- `infra/sandbox/run-simulation.sh` aplica `timeout -s KILL` sobre o `vvp`.
- `env.ts` parametriza imagem, timeout, memoria e CPU.
- O container e removido com `force: true` no `finally`, e o workdir apagado.
- **Falta**: auditoria das barreiras contra tentativas reais de escape, reducao
  da exposicao do socket do Docker, e verificacao de que o `iverilog` nao oferece
  caminho de leitura fora do workdir.

## 6. Escopo

**Dentro**

- Auditoria das barreiras com casos de abuso reais.
- Reducao da exposicao do socket do Docker.
- Verificacao de vetores especificos da toolchain (leitura de arquivo, execucao
  externa).
- Documentacao do modelo de ameaca.

**Fora**

- Isolamento por maquina virtual dedicada ou gVisor/Kata.
- Isolamento por usuario ou por tenant.
- Deteccao de intrusao e resposta a incidente.
- Auditoria de seguranca externa.

## 7. Criterios de aceite da feature

- [ ] Codigo do usuario nao alcanca a rede a partir do container.
- [ ] Codigo do usuario nao escreve fora do workdir e do `/tmp` do container.
- [ ] Codigo do usuario nao le arquivo do host fora do workdir.
- [ ] Nenhuma variavel de ambiente da API chega ao container.
- [ ] Container que excede memoria, CPU ou tempo e terminado.
- [ ] Nenhum container fica orfao apos falha do worker.
- [ ] A exposicao do socket do Docker esta reduzida ou documentada como risco
      aceito.
- [ ] O modelo de ameaca esta escrito.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-auditoria-do-sandbox.md) | Auditoria das barreiras do sandbox | `chore/rnf04-auditoria-do-sandbox` | M |
| [issue-02](issue-02-exposicao-docker-socket.md) | Reducao da exposicao do socket do Docker | `feat/rnf04-exposicao-docker-socket` | G |
| [issue-03](issue-03-vetores-toolchain.md) | Vetores especificos da toolchain Verilog | `chore/rnf04-vetores-toolchain` | M |

## 9. Dependencias

- Implementado por RF03/RF04; restringe RNF07.
- Depende do Docker no host e da imagem `tplab-sandbox:latest`.

## 10. Design

Sem interface propria. RNF04 e inteiramente de infraestrutura; as mensagens que o
usuario ve quando um limite e atingido pertencem a RF03 e RF04.

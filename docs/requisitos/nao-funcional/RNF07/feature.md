# RNF07 - Resposta inferior a cinco segundos em simulacoes de baixa complexidade

| Campo | Valor |
| --- | --- |
| ID | RNF07 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Pipeline de compilacao e simulacao |
| Status | Nao medido |
| Requisitos relacionados | RF03, RF04, RF06, RNF04, RNF05 |

## 1. Enunciado

> Simulacoes de baixa complexidade devem apresentar resposta em tempo inferior a
> cinco segundos, em condicoes normais de operacao.

## 2. O que e

Um alvo de desempenho ponta a ponta: do clique em "Executar" ate o resultado na
tela, em menos de cinco segundos, para os circuitos tipicos de uma disciplina
introdutoria - somador, multiplexador, contador.

O enunciado tem dois termos que precisam de definicao operacional para o
requisito ser verificavel:

- **"baixa complexidade"** - os exemplos de RF20 sao a definicao pratica;
- **"condicoes normais"** - a VM B2s prevista, sem fila acumulada, com a imagem
  do sandbox ja presente no host.

O orcamento dos 5 s se reparte por etapas conhecidas:

| Etapa | Onde |
| --- | --- |
| Requisicao e enfileiramento | `POST /api/simulations` |
| Espera na fila | BullMQ, `concurrency: 2` |
| Criacao do container | `docker.createContainer` + `start` |
| Compilacao | `iverilog` |
| Simulacao | `vvp` |
| Leitura de artefatos | logs + `.vcd` |
| Latencia do polling | `POLL_INTERVAL_MS` de 400 ms |
| Renderizacao | parse do VCD + desenho (RF06) |

## 3. Para que serve

O ciclo de aprendizado depende da resposta rapida: escrever, executar, ver o
erro, corrigir. Se cada volta custa quinze segundos, o aluno perde a linha de
raciocinio e a ferramenta deixa de ser um laboratorio para virar um formulario.

Cinco segundos e o limite classico em que a atencao ainda se mantem na tarefa. E,
para o TCC, e um dos poucos requisitos com numero - o que o torna facil de
verificar e de citar como resultado.

## 4. Impacto

**Para o usuario.** Determina se a ferramenta parece viva ou lenta.

**Nas decisoes ja tomadas.** Varias escolhas de arquitetura existem por causa
deste requisito e cobram seu preco:

- a fila (RF03) protege a API e acrescenta espera;
- o container efemero (RNF04) protege a maquina e custa centenas de milissegundos
  por execucao;
- o polling a cada 400 ms (`apps/web/src/lib/api.ts`) acrescenta ate 400 ms de
  latencia percebida - trocar por SSE/WebSocket eliminaria esse atraso, e o
  comentario no proprio arquivo ja registra a alternativa.

**Na percepcao.** Cinco segundos com estado visivel ("na fila, posicao 3",
"compilando") sao toleraveis; tres segundos sem nenhum sinal parecem travamento.
RF04-I03 trata disso, e e parte de como este requisito e cumprido na pratica.

**No que nao esta coberto.** O tempo de carregamento inicial da aplicacao nao e
objeto de RNF07, mas conta para a primeira impressao - e o Monaco domina o
bundle. Vale medir junto.

## 5. Estado atual no repositorio

- Nao ha medicao de desempenho em lugar nenhum.
- `SimulationResultSchema` carrega `durationMs`, com o comentario
  "RNF07: alvo < 5000" - mede apenas o tempo dentro do sandbox, nao o ponta a
  ponta.
- `POLL_INTERVAL_MS` e 400 ms e `POLL_TIMEOUT_MS` e 60 s em `lib/api.ts`.
- O worker roda com `concurrency: 2`.
- `SANDBOX_TIMEOUT_MS` e 10 s - o teto de seguranca, o dobro do alvo de
  desempenho.
- RF03-I04 preve a instrumentacao por etapa.
- **Falta**: medir, e reduzir o que estiver fora do orcamento.

## 6. Escopo

**Dentro**

- Definicao operacional de "baixa complexidade" e "condicoes normais".
- Medicao ponta a ponta, por etapa, na VM alvo.
- Reducao das etapas fora do orcamento.
- Registro dos numeros como evidencia para o TCC.

**Fora**

- Otimizacao para circuitos grandes.
- Escala horizontal com multiplos workers.
- Cache de compilacao entre submissoes identicas.
- Otimizacao do carregamento inicial do bundle (medido, nao otimizado aqui).

## 7. Criterios de aceite da feature

- [ ] "Baixa complexidade" e "condicoes normais" estao definidos por escrito.
- [ ] Ha medicao ponta a ponta, por etapa, na VM alvo.
- [ ] Os exemplos de RF20 completam em menos de 5 s, medidos no p95.
- [ ] O tempo de cada etapa esta registrado, identificando o maior custo.
- [ ] O usuario ve estado visivel durante toda a espera.
- [ ] Os numeros estao no `README.md`, citaveis no TCC.
- [ ] Se o alvo nao for atingido, a causa esta identificada e registrada.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-medicao-ponta-a-ponta.md) | Medicao ponta a ponta e orcamento de latencia | `chore/rnf07-medicao-ponta-a-ponta` | M |
| [issue-02](issue-02-reducao-de-latencia.md) | Reducao das etapas fora do orcamento | `feat/rnf07-reducao-de-latencia` | M |

## 9. Dependencias

- Depende de RF03-I04 (instrumentacao) e de RF01-I02 (a VM alvo).
- Restringido por RNF04 (custo do isolamento) e RNF05 (limites).
- Verificado junto com RF20 (exemplos de referencia).

## 10. Design

Sem interface propria. Os estados de espera pertencem a RF04-I03 - ver
`docs/requisitos/funcional/RF04/figma/WILL-BE-DONE.md`.

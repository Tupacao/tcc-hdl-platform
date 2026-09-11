# Requisitos do TPLab

Esta pasta detalha cada requisito do MVP em uma pasta propria. O documento
consolidado, com a priorizacao MoSCoW e a justificativa, continua em
[`Requisitos.md`](Requisitos.md); o contexto de stack e decisoes esta em
[`../PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).

## Como cada pasta e organizada

```
funcional/RF04/
  feature.md                    contextualizacao do requisito
  issue-01-....md               uma issue = uma branch
  issue-02-....md
  figma/WILL-BE-DONE.md         placeholder do design
```

**`feature.md`** responde o que o requisito e, para que serve, qual o impacto no
produto e na arquitetura, o que ja existe no repositorio, o escopo (dentro e
fora), os criterios de aceite e a quebra em issues.

**`issue-NN-*.md`** e a unidade de trabalho: contexto, objetivo, escopo tecnico
com os arquivos envolvidos, passo a passo, criterios de aceite, comandos de
verificacao e riscos. Cada uma tem uma branch propria, nomeada no cabecalho.
Requisitos pequenos tem duas issues; a feature inteira pode caber em uma branch
quando as issues forem sequenciais e curtas.

**`figma/WILL-BE-DONE.md`** lista os frames que o design precisa entregar e as
decisoes visuais ainda em aberto. O arquivo de Figma existe em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-)
e ja cobre 11 paginas: "0 · Home" (landing), "1 · Fundamentos" (tokens,
tipografia, glossario), "2 · Workspace" (tela principal em todos os estados
de execucao, divisores e atalhos), "3 · Editor de código" (autocompletar,
exemplos, abas e carregamento), "4 · Console e diagnósticos" (incluindo
`429`/`400`/truncamento), "5 · Formas de onda", "6 · Projetos" (incluindo
carga/erro/exportacao), "7 · Documentação e onboarding" (incluindo tour
guiado completo), "8 · Contas e acesso" (login Google, compartilhamento e
autorizacao) e "10 · Avulsos" (feedback, metricas, preferencias, navegador
nao suportado). Ver `docs/FIGMA-PROTOTIPOS.md` para o mapa completo bloco a
bloco e a lista de decisoes de design ja fechadas.

Praticamente todo o design do MVP esta **feito**: RF01 a RF11, RF14 a RF20,
RNF01, RNF02, RNF06 e RNF09 tem cobertura completa ou quase completa (o
`WILL-BE-DONE.md` de cada um lista qualquer detalhe secundario que ainda
falta). **RNF03 (responsividade) e o unico requisito sem nenhum frame** —
nenhuma tela do arquivo existe fora de 1920px, o que trava o inicio de
RF09-I01. RF12/RF13/RF21 (editor visual, pagina "9 · Editor visual") tem o
essencial desenhado mas ainda faltam estados de interacao secundarios
(hover/selecionado/arrastando de blocos, controles do canvas) — so relevante
se a Fase 11 entrar no cronograma.

Requisitos puramente de infraestrutura (RNF04, RNF07, RNF08) nao tem pasta
`figma/`. RNF05 tambem nao tem, mas o arquivo publicado acabou desenhando dois
frames marcados "RNF05" (timeout de simulacao e limites em Preferencias) — ver
a nota em `docs/FIGMA-PROTOTIPOS.md`.

Tamanhos usados nas issues: **P** ~0,5 dia, **M** ~1 dia, **G** ~2 dias.

## Requisitos funcionais

### Must Have

| ID | Requisito | Issues | Status |
| --- | --- | --- | --- |
| [RF01](funcional/RF01/feature.md) | Acesso integral por navegador | 3 | Parcial |
| [RF02](funcional/RF02/feature.md) | Editor Verilog com destaque de sintaxe | 3 | Parcial |
| [RF03](funcional/RF03/feature.md) | Compilacao no servidor | 4 | Parcial |
| [RF04](funcional/RF04/feature.md) | Simulacao a partir de testbench | 3 | Parcial |
| [RF05](funcional/RF05/feature.md) | Erros contextualizados por linha | 3 | Parcial |
| [RF06](funcional/RF06/feature.md) | Visualizador de formas de onda | 4 | Nao implementado |
| [RF07](funcional/RF07/feature.md) | CRUD de projetos | 3 | Parcial |
| [RF08](funcional/RF08/feature.md) | Exportacao em `.zip` | 2 | Nao implementado |
| [RF09](funcional/RF09/feature.md) | Interface unica integrada | 3 | Parcial |
| [RF10](funcional/RF10/feature.md) | Modo claro e escuro | 2 | Parcial |
| [RF11](funcional/RF11/feature.md) | Documentacao estatica | 3 | Nao implementado |

### Should Have

| ID | Requisito | Issues | Status |
| --- | --- | --- | --- |
| [RF12](funcional/RF12/feature.md) | Editor visual de circuitos | 4 | Nao implementado |
| [RF13](funcional/RF13/feature.md) | Geracao de Verilog do circuito | 3 | Nao implementado |
| [RF14](funcional/RF14/feature.md) | Autenticacao com Google | 3 | Nao implementado |
| [RF15](funcional/RF15/feature.md) | Links publicos de compartilhamento | 2 | Nao implementado |
| [RF16](funcional/RF16/feature.md) | Tutorial guiado | 2 | Nao implementado |
| [RF17](funcional/RF17/feature.md) | Envio de feedback | 2 | Nao implementado |

### Could Have

| ID | Requisito | Issues | Status |
| --- | --- | --- | --- |
| [RF18](funcional/RF18/feature.md) | Autocompletar Verilog | 2 | Nao implementado |
| [RF19](funcional/RF19/feature.md) | Metricas anonimas de uso | 2 | Nao implementado |
| [RF20](funcional/RF20/feature.md) | Projetos de exemplo | 2 | Parcial |
| [RF21](funcional/RF21/feature.md) | Sequenciais no editor visual | 2 | Nao implementado |

## Requisitos nao funcionais

| ID | Requisito | Issues | Status |
| --- | --- | --- | --- |
| [RNF01](nao-funcional/RNF01/feature.md) | Interface simples para iniciantes | 2 | Parcial |
| [RNF02](nao-funcional/RNF02/feature.md) | Compatibilidade entre navegadores | 2 | Nao verificado |
| [RNF03](nao-funcional/RNF03/feature.md) | Responsividade a partir de 1024px | 2 | Parcial |
| [RNF04](nao-funcional/RNF04/feature.md) | Execucao isolada em conteineres | 3 | Implementado |
| [RNF05](nao-funcional/RNF05/feature.md) | Limites de tempo e memoria | 2 | Implementado |
| [RNF06](nao-funcional/RNF06/feature.md) | Autenticacao e autorizacao | 2 | Nao implementado |
| [RNF07](nao-funcional/RNF07/feature.md) | Resposta em menos de 5 segundos | 2 | Nao medido |
| [RNF08](nao-funcional/RNF08/feature.md) | Arquitetura modular | 2 | Parcial |
| [RNF09](nao-funcional/RNF09/feature.md) | Contraste WCAG AA | 2 | Nao verificado |

## Plano de implementacao

A ordem abaixo respeita as dependencias declaradas em cada `feature.md` e a
prioridade de `docs/PROJECT_CONTEXT.md`. Marque os itens conforme forem
concluidos.

### Cascata ou paralelo?

Na pratica o plano se **executa** em cascata, mas nao porque as tarefas sejam
todas encadeadas: e porque ha uma pessoa so trabalhando. O grafo de dependencias
real tem quatro trilhas quase independentes, que poderiam avancar em paralelo se
houvesse mais gente:

| Trilha | Requisitos | Toca |
| --- | --- | --- |
| A - Pipeline | RF03, RF04, RNF04, RNF05, RNF07, RNF08 | `apps/api`, `infra/sandbox` |
| B - Edicao | RF02, RF05, RF09, RF10, RF18 | `apps/web/features/workspace` |
| C - Ondas | RF06 | `apps/web/features/waveform` |
| D - Projetos e contas | RF07, RF08, RF14, RNF06, RF15, RF17, RF19 | `apps/api/modules/projects`, `apps/web/features/projects` |

O que e **genuinamente serial** sao tres cadeias, e vale conhece-las porque sao
elas que ditam o caminho critico do cronograma:

1. `RF07-I01 -> RF14-I01 -> RF14-I02 -> RNF06-I01 -> RF01-I02` - persistir,
   identificar, autorizar e so entao publicar. A mais longa e a unica inegociavel.
2. `RF06-I01 -> I02 -> I03 -> I04` - o visualizador so existe inteiro no fim.
3. `RF12-I01 -> I02 -> RF13-I01 -> I02 -> I03` - o editor visual so tem saida
   depois da geracao de codigo.

Dentro de uma feature, as issues quase sempre sao sequenciais (`I01` antes de
`I02`); entre features de trilhas diferentes, raramente. As fases abaixo agrupam
o que faz sentido entregar junto, nao o que precisa ser feito junto.

### Checklist por requisito

- [ ] **RF03** Compilacao no servidor - fechar robustez do pipeline
- [ ] **RF04** Simulacao a partir de testbench
- [ ] **RF05** Erros contextualizados por linha
- [ ] **RF02** Editor Verilog com destaque de sintaxe
- [ ] **RF06** Visualizador de formas de onda
- [ ] **RF07** CRUD de projetos
- [ ] **RF08** Exportacao em `.zip`
- [ ] **RF09** Interface unica integrada
- [ ] **RF10** Modo claro e escuro
- [ ] **RF20** Projetos de exemplo
- [ ] **RF11** Documentacao estatica
- [ ] **RF14** Autenticacao com Google
- [ ] **RNF06** Autenticacao e autorizacao
- [ ] **RF01** Acesso integral por navegador (publicacao)
- [ ] **RNF09** Contraste WCAG AA
- [ ] **RNF02** Compatibilidade entre navegadores
- [ ] **RNF03** Responsividade a partir de 1024px
- [ ] **RNF01** Interface simples para iniciantes
- [ ] **RNF04** Execucao isolada em conteineres
- [ ] **RNF05** Limites de tempo e memoria
- [ ] **RNF07** Resposta em menos de 5 segundos
- [ ] **RNF08** Arquitetura modular
- [ ] **RF15** Links publicos de compartilhamento
- [ ] **RF16** Tutorial guiado
- [ ] **RF17** Envio de feedback
- [ ] **RF12** Editor visual de circuitos
- [ ] **RF13** Geracao de Verilog do circuito
- [ ] **RF21** Sequenciais no editor visual
- [ ] **RF18** Autocompletar Verilog
- [ ] **RF19** Metricas anonimas de uso

### Checklist por issue

Formato: `ID` Titulo - `branch` (tamanho). **P** ~0,5 dia, **M** ~1 dia,
**G** ~2 dias.

#### Fase 1 - Robustez do pipeline (trilha A)

- [ ] **RF03-I01** Limites e validacao de submissao - `feat/rf03-limites-de-submissao` (P)
- [ ] **RF03-I02** Rate limit dedicado e tratamento de fila saturada - `feat/rf03-rate-limit-e-fila-cheia` (M)
- [ ] **RF03-I03** Retencao e expiracao dos resultados de job - `feat/rf03-retencao-resultados-job` (P)
- [ ] **RF03-I04** Logs estruturados e metricas do worker - `feat/rf03-observabilidade-worker` (M)
- [ ] **RF04-I01** Contrato de testbench e coerencia do modulo de topo - `feat/rf04-contrato-testbench` (M)
- [ ] **RF04-I02** Limites e truncamento da saida da simulacao - `feat/rf04-limites-saida-simulacao` (P)
- [ ] **RF05-I01** Ampliar a cobertura do parser de diagnosticos - `feat/rf05-cobertura-parser-diagnosticos` (M)

> RF03-I03 e RF04-I02 decidem os mesmos tetos de tamanho - fazer as duas com os
> numeros na mesma mesa.

#### Fase 2 - Editor e diagnosticos (trilha B)

- [ ] **RF02-I01** Validar e ajustar a definicao de linguagem Verilog no Monaco - `feat/rf02-linguagem-verilog-monaco` (M)
- [ ] **RF02-I02** Tema sincronizado e opcoes de ergonomia do editor - `feat/rf02-tema-e-ergonomia-editor` (P)
- [ ] **RF02-I03** Abas de arquivo com preservacao de estado por arquivo - `feat/rf02-abas-design-testbench` (M)
- [ ] **RF05-I02** Navegacao do console ate a linha no editor - `feat/rf05-navegacao-console-editor` (M)
- [ ] **RF05-I03** Explicacoes em portugues para erros frequentes - `feat/rf05-mensagens-amigaveis` (M)
- [ ] **RF04-I03** Estados de execucao e cancelamento no frontend - `feat/rf04-estados-execucao-frontend` (M)

#### Fase 3 - Visualizador de formas de onda (trilha C)

- [ ] **RF06-I01** Parser de VCD e modelo de sinais - `feat/rf06-parser-vcd` (M)
- [ ] **RF06-I02** Renderizacao das formas de onda em canvas - `feat/rf06-renderizacao-canvas` (G)
- [ ] **RF06-I03** Zoom, deslocamento, selecao de sinais e cursor de tempo - `feat/rf06-interacao-zoom-cursor` (G)
- [ ] **RF06-I04** Desempenho com arquivos grandes e acessibilidade - `feat/rf06-desempenho-acessibilidade` (M)

> Trilha independente das fases 1 e 2: so precisa que o `.vcd` chegue, o que ja
> acontece hoje.

#### Fase 4 - Projetos e exportacao (trilha D)

- [ ] **RF07-I01** Persistencia com Prisma e PostgreSQL - `feat/rf07-persistencia-prisma-postgres` (G)
- [ ] **RF07-I02** Interface de gerenciamento de projetos - `feat/rf07-interface-gerenciamento-projetos` (G)
- [ ] **RF07-I03** Vinculo do workspace com o projeto aberto - `feat/rf07-vinculo-workspace-projeto` (M)
- [ ] **RF08-I01** Endpoint de exportacao em `.zip` - `feat/rf08-endpoint-exportacao-zip` (M)
- [ ] **RF08-I02** Acao de exportar na interface - `feat/rf08-acao-exportar-interface` (P)

#### Fase 5 - Integracao, tema e conteudo

- [ ] **RF09-I01** Persistencia e restauracao do layout dos paineis - `feat/rf09-persistencia-layout-paineis` (P)
- [ ] **RF09-I02** Atalhos de teclado do fluxo principal - `feat/rf09-atalhos-teclado-fluxo` (M)
- [ ] **RF09-I03** Semantica das abas, divisores e barra de estado - `feat/rf09-semantica-e-barra-de-estado` (M)
- [ ] **RF10-I01** Seletor de tema com os tres modos - `feat/rf10-seletor-tres-modos` (P)
- [ ] **RF10-I02** Aplicar o tema antes da primeira pintura - `feat/rf10-anti-flash-carregamento` (P)
- [ ] **RF20-I01** Catalogo de exemplos e verificacao automatizada - `feat/rf20-catalogo-de-exemplos` (M)
- [ ] **RF20-I02** Seletor de exemplos na interface - `feat/rf20-seletor-de-exemplos` (P)
- [ ] **RF11-I01** Navegacao e layout da documentacao - `feat/rf11-navegacao-e-layout-docs` (M)
- [ ] **RF11-I02** Conteudo do guia de inicio rapido - `feat/rf11-guia-inicio-rapido` (M)
- [ ] **RF11-I03** Conteudo da referencia de sintaxe Verilog - `feat/rf11-referencia-sintaxe-verilog` (M)

> RF11-I01 decide se o SPA ganha roteador. A escolha vale tambem para RF07-I02 e
> RF15-I02 - se ja tiver sido tomada na fase 4, seguir a mesma.

#### Fase 6 - Identidade, autorizacao e publicacao (caminho critico)

- [ ] **RF14-I01** Fluxo OAuth2 com Google e sessao - `feat/rf14-oauth-google-sessao` (G)
- [ ] **RF14-I02** Modelo de usuario e posse dos projetos - `feat/rf14-modelo-usuario-posse-projeto` (M)
- [ ] **RF14-I03** Interface de login e convivencia com o modo anonimo - `feat/rf14-interface-login-modo-anonimo` (M)
- [ ] **RNF06-I01** Autorizacao nas rotas de projeto - `feat/rnf06-autorizacao-rotas-projeto` (M)
- [ ] **RNF06-I02** Testes de acesso negado e revisao da superficie - `chore/rnf06-testes-de-acesso-negado` (M)
- [ ] **RF01-I01** Build de producao do frontend e configuracao por ambiente - `feat/rf01-build-producao-frontend` (P)
- [ ] **RF01-I02** Deploy da API, worker e infraestrutura na VM com HTTPS - `feat/rf01-deploy-api-worker-vm` (G)
- [ ] **RF01-I03** Verificacao de acesso em maquina limpa e documentacao - `chore/rf01-verificacao-acesso-limpo` (P)

> Ordem inegociavel. Publicar (RF01-I02) com dados persistidos e sem RNF06
> exporta os projetos de todos os usuarios.

#### Fase 7 - Verificacao da interface

- [ ] **RNF09-I01** Auditoria de contraste dos tokens de tema - `chore/rnf09-auditoria-tokens-de-tema` (M)
- [ ] **RNF09-I02** Contraste do editor e do visualizador de ondas - `chore/rnf09-contraste-editor-e-ondas` (M)
- [ ] **RNF02-I01** Declaracao do alvo de build e navegadores suportados - `chore/rnf02-alvo-de-build-e-suporte` (P)
- [ ] **RNF02-I02** Matriz de verificacao entre navegadores - `chore/rnf02-matriz-verificacao-navegadores` (M)
- [ ] **RNF03-I01** Verificacao e ajuste nas larguras alvo - `chore/rnf03-verificacao-larguras-alvo` (M)
- [ ] **RNF03-I02** Comportamento abaixo da largura minima - `feat/rnf03-comportamento-abaixo-do-minimo` (M)
- [ ] **RNF01-I01** Glossario e revisao dos textos de interface - `chore/rnf01-vocabulario-e-textos` (M)
- [ ] **RNF01-I02** Estados vazios e verificacao com usuarios - `chore/rnf01-estados-vazios-e-teste-usuario` (M)

> RNF02-I02 precisa da URL publica de RF01-I02. RNF01-I02 so faz sentido depois
> de RF11 e RF16, senao mede uma plataforma incompleta.

#### Fase 8 - Seguranca e desempenho (evidencia do TCC)

- [ ] **RNF04-I01** Auditoria das barreiras do sandbox - `chore/rnf04-auditoria-do-sandbox` (M)
- [ ] **RNF04-I02** Reducao da exposicao do socket do Docker - `feat/rnf04-exposicao-docker-socket` (G)
- [ ] **RNF04-I03** Vetores especificos da toolchain Verilog - `chore/rnf04-vetores-toolchain` (M)
- [ ] **RNF05-I01** Verificacao dos limites e fidelidade do desfecho - `chore/rnf05-verificacao-dos-limites` (M)
- [ ] **RNF05-I02** Dimensionamento dos valores com medicao - `chore/rnf05-dimensionamento-dos-valores` (M)
- [ ] **RNF07-I01** Medicao ponta a ponta e orcamento de latencia - `chore/rnf07-medicao-ponta-a-ponta` (M)
- [ ] **RNF07-I02** Reducao das etapas fora do orcamento - `feat/rnf07-reducao-de-latencia` (M)

> Trilha independente da interface: pode avancar em paralelo com as fases 5 e 7.
> RNF05-I02 e RNF07-I01 dependem da instrumentacao de RF03-I04.

#### Fase 9 - Modularidade

- [ ] **RNF08-I01** Generalizacao do job por tipo de toolchain - `feat/rnf08-generalizacao-do-job` (G)
- [ ] **RNF08-I02** Prova de conceito com uma segunda toolchain - `feat/rnf08-prova-de-conceito-ghdl` (M)

#### Fase 10 - Should Have restantes

- [ ] **RF15-I01** Token de compartilhamento e rota publica - `feat/rf15-token-e-rota-publica` (M)
- [ ] **RF15-I02** Interface de compartilhar e pagina do projeto compartilhado - `feat/rf15-interface-compartilhar-e-visualizar` (M)
- [ ] **RF16-I01** Tour guiado, roteiro e ancoras - `feat/rf16-tour-e-ancoras` (M)
- [ ] **RF16-I02** Controle de primeiro acesso e reabertura - `feat/rf16-primeiro-acesso-e-reabertura` (P)
- [ ] **RF17-I01** Endpoint, validacao e armazenamento do feedback - `feat/rf17-endpoint-e-armazenamento` (M)
- [ ] **RF17-I02** Formulario de feedback na interface - `feat/rf17-formulario-na-interface` (P)

#### Fase 11 - Editor visual (so com prazo folgado)

- [ ] **RF12-I01** Canvas React Flow e biblioteca de blocos logicos - `feat/rf12-canvas-e-biblioteca-blocos` (G)
- [ ] **RF12-I02** Conexoes, terminais e validacao do grafo - `feat/rf12-conexoes-e-validacao-grafo` (G)
- [ ] **RF12-I03** Modelo e persistencia do circuito no projeto - `feat/rf12-persistencia-circuito` (M)
- [ ] **RF12-I04** Integracao do editor visual no workspace - `feat/rf12-integracao-workspace` (M)
- [ ] **RF13-I01** Representacao intermediaria e ordenacao topologica - `feat/rf13-representacao-intermediaria` (M)
- [ ] **RF13-I02** Emissor de Verilog legivel - `feat/rf13-emissor-verilog` (M)
- [ ] **RF13-I03** Fluxo gerar e simular a partir do canvas - `feat/rf13-fluxo-gerar-e-simular` (M)
- [ ] **RF21-I01** Blocos sequenciais, clock e validacao com memoria - `feat/rf21-blocos-sequenciais-e-clock` (G)
- [ ] **RF21-I02** Geracao de Verilog sequencial - `feat/rf21-geracao-verilog-sequencial` (M)

> As tres features andam juntas: RF12 sem RF13 e um canvas sem saida. Entrar
> nesta fase pela metade e o maior risco de cronograma do projeto.

#### Fase 12 - Could Have restantes

- [ ] **RF18-I01** Provider de autocompletar com palavras-chave e tarefas de sistema - `feat/rf18-provider-palavras-chave` (M)
- [ ] **RF18-I02** Snippets e identificadores do arquivo - `feat/rf18-snippets-e-identificadores` (M)
- [ ] **RF19-I01** Catalogo de eventos e coleta anonima - `feat/rf19-eventos-e-coleta` (M)
- [ ] **RF19-I02** Aviso, recusa e relatorio agregado - `feat/rf19-consentimento-e-relatorio` (M)

> RF19 precisa das duas issues juntas, ou a coleta comeca sem consentimento.

## Dependencias que atravessam requisitos

- **RNF06 bloqueia a publicacao com dados reais.** RF07-I01 (Prisma) e RF01-I02
  (deploy) juntos, sem RNF06, tornam publicos os projetos de todos os usuarios.
- **RF14 antecede RNF06.** Nao ha autorizacao sem identidade.
- **RF02-I03 antecede RF05-I02.** A navegacao ate a linha do erro precisa de um
  modelo do Monaco por arquivo.
- **RF12 antecede RF13 antecede RF21.** Sem geracao de codigo o canvas nao chega
  ao pipeline; sem o canvas nao ha o que estender.
- **RF03-I04 antecede RNF07 e RNF05-I02.** A instrumentacao do worker e a fonte
  dos numeros de desempenho e de dimensionamento.
- **RF04-I02, RF03-I03 e RF06 compartilham os tetos de tamanho.** O limite do
  `.vcd`, a retencao do job e o que o visualizador aguenta precisam ser decididos
  juntos.

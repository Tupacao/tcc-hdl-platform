# O que precisa ser prototipado no Figma

> Documento de trabalho, **nao versionado**. Consolida os 26 arquivos
> `docs/requisitos/**/figma/WILL-BE-DONE.md` em uma lista unica, organizada por
> tela em vez de por requisito, para servir de escopo do arquivo de Figma.
>
> Arquivo de Figma:
> [HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).
>
> Quando um bloco ficar pronto, substituir o `WILL-BE-DONE.md` do requisito
> correspondente pelo link dos frames — feito para os Blocos 1, 3, 4, 5, 6, 7,
> 8 e 10 (ver abaixo).

Requisitos **sem** necessidade de design: RNF04 (isolamento por conteineres),
RNF07 (desempenho) e RNF08 (arquitetura modular). Sao de infraestrutura; o que
o usuario ve quando um limite e atingido pertence a RF03 e RF04.

**Achado durante a revisao do arquivo real:** RNF05 (limites de tempo e
memoria) foi listado acima como sem necessidade de design, mas o arquivo
publicado acabou desenhando dois frames explicitamente marcados "RNF05" -
[2.8 · Simulação interrompida por tempo limite](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=84-2)
e a secao EXECUCAO de
[10.3 · Preferências](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=86-2)
(limite de 10s e 128MB, visiveis mas nao ajustaveis). RNF05 nao tem pasta
`figma/` porque o `README.md` de requisitos o classifica como puramente de
infraestrutura — vale avaliar se esses dois frames merecem ser referenciados
no `feature.md` de RNF05 diretamente.

---

## Ordem sugerida de prototipacao

A ordem segue o plano de implementacao de `docs/requisitos/README.md`: o design
precisa estar pronto **antes** da issue que o consome, nao depois.

| # | Bloco | Bloqueia | Status |
| --- | --- | --- | --- |
| 1 | [Fundamentos](#1-fundamentos-design-system) | tudo | **feito** |
| 2 | [Workspace](#2-workspace-tela-principal) | RF09-I01, RNF03-I01 | feito, exceto RNF03 |
| 3 | [Editor e abas](#3-editor-de-codigo) | RF02-I02, RF02-I03 | **feito** |
| 4 | [Console e diagnosticos](#4-console-de-saida-e-diagnosticos) | RF05-I02, RF05-I03 | **feito** |
| 5 | [Formas de onda](#5-visualizador-de-formas-de-onda) | RF06-I02, RF06-I03 | **feito** |
| 6 | [Projetos](#6-projetos) | RF07-I02 | **feito** |
| 7 | [Documentacao e onboarding](#7-documentacao-e-onboarding) | RF11-I01, RF20-I02, RF16-I01 | **feito** |
| 8 | [Contas e acesso](#8-contas-e-acesso) | RF14-I03, RF15-I02 | **feito** |
| 9 | [Editor visual](#9-editor-visual-de-circuitos) | RF12-I01 em diante | avancado — faltam estados de interacao |
| 10 | [Avulsos](#10-avulsos) | RF17-I02, RF19-I02, RNF02-I01 | **feito** |

**Unico bloco sem nenhuma cobertura: RNF03 (responsividade).** Ver a secao
final deste documento.

---

## 1. Fundamentos (design system)

**Atende:** RF10, RNF09, RNF01, RNF03
**Status: feito.** Pagina "1 · Fundamentos" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-2),
consolidada em `docs/design-system-fundamentos.md`. RNF03 (responsividade)
ficou fora do que os quatro frames entregaram — segue pendente (ver secao
final).

Nao sao telas - sao as definicoes das quais todo o resto depende. Sem elas, cada
tela redecide as mesmas coisas.

- [x] **Tabela de tokens de cor** com valor no tema claro e no escuro para cada
      token de `apps/web/src/index.css`: `--background`, `--foreground`,
      `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`,
      `--destructive`, `--success`, `--warning`, `--border`, `--input`, `--ring`.
      → [1.1 · Tokens de cor e contraste verificado](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=34-2)
- [x] **Razao de contraste calculada** para cada par em uso, nos dois temas.
      Pares que ja se sabe criticos: `--muted-foreground` sobre `--muted`;
      `--destructive` e `--warning` sobre `--background` e sobre `--card`;
      `--border` e `--input` no escuro (hoje branco a 12% e 18% de opacidade, que
      provavelmente nao atingem os 3:1 exigidos); `--ring` como anel de foco sobre
      cada fundo. → mesmo frame (1.1), consolidado em
      `docs/design-system-fundamentos.md` secao 2.
- [x] **Tokens novos** que ainda nao existem e que RF06 vai precisar: cores de
      forma de onda (nivel logico, barramento, `x`, `z`, grade, cursor). →
      [1.2 · Formas de onda — tokens, geometria e anatomia](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=36-2)
- [x] **Tipografia**: familia monoespacada do editor com tamanho e altura de
      linha; tipografia de conteudo longo para RF11 (titulos, paragrafo, lista,
      tabela, codigo em linha, nota, aviso). →
      [1.3 · Tipografia, densidade e glossário](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=38-2).
      A paleta de sintaxe do editor (RF02) ganhou frame proprio:
      [1.4 · Destaque de sintaxe Verilog](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=89-2).
- [x] **Densidade**: espacamento, tamanho de fonte e alvo de clique confortaveis
      para publico iniciante (RNF01). → mesmo frame (1.3).
- [x] **Glossario de interface**: termo unico adotado para design, testbench,
      modulo de topo, compilar, simular, forma de onda, diagnostico, projeto,
      executar (RNF01-I01). → mesmo frame (1.3); o termo adotado no glossario e
      "circuito" e "modulo principal" (nao "design"/"top module" como listado
      aqui — ver `docs/design-system-fundamentos.md` secao 6).

> Um token entregue sem verificacao de contraste vira retrabalho na
> implementacao. A verificacao faz parte da entrega.

**Extra, fora do escopo original deste bloco:** a pagina "0 · Home" e uma
landing page de divulgacao do TCC (hero, mock do produto, cards de recursos,
"como funciona", posicionamento e rodape), em variantes clara/escura e com um
teaser de retomada de projeto. E util como referencia visual, mas nao
substitui os frames que os requisitos abaixo ja pedem e ja tem, em detalhe,
nos blocos 2 a 10.

---

## 2. Workspace (tela principal)

**Atende:** RF09, RNF03, RF01
**Status: feito, exceto RNF03.** Pagina "2 · Workspace" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-3),
com 9 frames (2.1 a 2.9).

- [ ] Workspace completo, tema claro e escuro, em **1024, 1366 e 1920 px**. O
      frame de 1024 e o que decide o design - e o mais apertado. → so existe
      em 1920px ate agora (2.1 escuro, 2.2 claro). **Unico item pendente
      deste bloco — ver a secao final sobre RNF03.**
- [x] Cabecalho: identidade, projeto aberto com indicador de nao salvo, acao de
      executar, alternador de tema, acesso a documentacao e a lista de projetos.
- [x] Barra de estado no rodape: desfecho da ultima execucao, duracao, contagem
      de erros e avisos, estado do projeto.
- [x] Divisores de painel: repouso, hover, arraste e foco por teclado. →
      [2.9 · Divisores de painel e atalhos (RF09 · RNF01)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=106-67) —
      alca de 8×42px no hover, linha laranja com medida ao vivo no arraste,
      anel deslocado + "← → ajustar" no foco.
- [x] Painel de atalhos de teclado (dialogo). → mesmo frame 2.9: dialogo
      acionado por `?`, com Executar/Salvar/Comentar/Ir ao proximo
      erro/Focar o proximo painel/Abrir os atalhos.
- [x] Layout no primeiro acesso, antes de qualquer execucao. →
      [2.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=55-2).
- [ ] **Comportamento abaixo de 1024 px** - a decisao central de RNF03: manter
      rolagem horizontal (o que o codigo faz hoje), empilhar os paineis ou
      mostrar um de cada vez.
- [ ] Aviso de largura insuficiente, se a decisao acima incluir um.
- [ ] Comportamento em tela muito larga: onde o conteudo para de crescer.
- [x] Estado de carregamento inicial da SPA (splash / skeleton) e estado de
      "API indisponivel" (RF01). →
      [2.6](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-2)
      e
      [2.7](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-13).
      Bonus: [2.8 · timeout (RNF05)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=84-2)
      tambem foi desenhado, mesmo RNF05 nao tendo pasta `figma/` propria.

**Decisoes que o design ainda precisa fixar** (todas dependem de RNF03):

- proporcao padrao dos tres paineis e **largura minima de cada um** abaixo de
  1024px, validada com conteudo real dentro (linha tipica de Verilog,
  diagnostico completo, coluna de nomes de sinais mais trecho de tempo);
- altura do cabecalho e da barra de estado - hoje o codigo usa
  `h-[calc(100%-1.75rem)]`, acoplado a um valor fixo que o design deve confirmar
  ou substituir.

---

## 3. Editor de codigo

**Atende:** RF02, RF05 (marcadores), RF18, RF10
**Status: feito.** Paleta em "1 · Fundamentos" (1.4); editor em uso nas
paginas "2 · Workspace" e "3 · Editor de código"
([3.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=68-2)
e
[3.2](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=106-2)).

- [x] Painel do editor nos dois temas, com a **paleta de tokens de sintaxe**:
      palavra-chave, tipo, numero, string, comentario, tarefa de sistema,
      operador, texto normal, fundo, numero de linha, linha atual, selecao.
- [x] Barra de abas de arquivo (design / testbench): ativa, inativa, hover, foco
      por teclado, **com erro** e **com alteracao nao salva**. → 3.2, seis
      estados. **Decisao de design**: o "nao salvo" e o "com erro" viram um
      ponto colorido que substitui o `✕` (dois alvos de 7px lado a lado numa
      aba de 38px seria erro de clique garantido); o `✕` volta no hover.
- [x] Estado vazio do editor e estado de carregamento do Monaco. → 3.2: "Comece
      escrevendo o modulo…" e esqueleto com linhas de larguras diferentes
      imitando a forma do codigo (nao uma barra de progresso).
- [x] Marcacao de diagnostico dentro do editor: sublinhado, simbolo na margem e
      tooltip. →
      [2.3 · erro de compilação](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=48-2)
      (`TooltipErro`).
- [x] Lista de sugestoes de autocompletar (RF18): item, item selecionado, icone
      por categoria (palavra-chave, tarefa de sistema, snippet, identificador) e
      painel de descricao. →
      [3.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=68-2).
- [x] Controle de tema com **tres estados** (claro, escuro, sistema): fechado,
      aberto, opcao ativa, foco. → resolvido como controle **segmentado**
      (as tres opcoes sempre visiveis, rotuladas em texto), nao um botao que
      abre/fecha.

**Decisao pendente:** se os temas padrao `vs` / `vs-dark` do Monaco nao passarem
no contraste AA, o design precisa fornecer os valores de um tema customizado.
→ ja resolvido: 1.4 fornece a paleta completa de um tema customizado.

---

## 4. Console de saida e diagnosticos

**Atende:** RF05, RF03, RF04, RNF01
**Status: feito.** Pagina "4 · Console e diagnósticos" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-5)
(2 frames: 4.1 e 4.2) mais
[2.3](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=48-2)
na pagina "2 · Workspace".

- [x] Item de diagnostico: erro, aviso e informativo, nos dois temas, cada um com
      icone, `arquivo:linha`, mensagem e foco visivel.
- [x] Item de diagnostico **sem linha** (nao clicavel) - →
      [4.2](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=107-2),
      lado a lado com um diagnostico normal: sem cursor de clique, nao acende
      no hover, nao alcancavel por Tab.
- [x] Console com lista longa: agrupamento por arquivo e contagem no cabecalho
      ("3 erros, 1 aviso"). → cartao "Saida longa": rolagem trava no ponto,
      botao "ir para o fim · 1284 linhas".
- [x] Bloco de explicacao amigavel (RF05-I03): →
      [documentação de erros mais comuns (7.2)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=65-2)
      liga o erro no console a explicacao na documentacao.
- [x] **Progressao do botao "Executar"**: repouso, na fila, compilando,
      simulando, desabilitado. →
      [2.4](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=54-2).
- [x] Acao de **cancelar** a espera, visivel so durante a execucao.
- [x] Estados de erro da plataforma, cada um com texto proprio:
      - [x] servico indisponivel (`503`, Redis fora do ar) →
        [2.7](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-13);
      - [x] limite de uso atingido (`429`) →
        [4.2](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=107-2),
        com contagem regressiva no rotulo do botao Executar;
      - [x] entrada rejeitada / arquivo grande demais (`400`) → mesmo frame
        4.2, fora do painel Problemas de proposito (erro do cliente, nao do
        compilador);
      - [x] tempo limite excedido, com orientacao sobre `$finish` →
        [2.8](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=84-2);
      - [x] simulacao concluida **sem** forma de onda, explicando `$dumpfile` e
        `$dumpvars` →
        [5.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=79-2);
      - [x] saida truncada (stdout e `.vcd`) → 4.2, com a ressalva "as formas
        de onda nao foram afetadas";
      - [x] incoerencia entre `topModule` e o testbench → 4.2, "Testbench nao
        instancia o modulo principal" (aviso, nao erro, com acao "Definir
        modulo principal").
- [x] Console vazio: antes da primeira execucao ("Nunca executado") e depois de
      execucao sem erros (cartao "Apenas avisos — a execução foi bem").

**Restricao (RNF09):** severidade nunca comunicada apenas por cor - icone, texto
ou forma junto. Confirmado em uso: badge ambar + texto para aviso, nunca so
cor.

---

## 5. Visualizador de formas de onda

**Atende:** RF06, RNF09
**Status: feito.** Pagina "5 · Formas de onda" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=79-2),
mais a anatomia em "1 · Fundamentos" (1.2) e o componente em uso real na
tela de projeto compartilhado (8.2).

O componente visual mais denso da plataforma. Nada dele pode ser implementado a
partir de descricao textual.

- [x] Painel completo em uso: coluna de nomes a esquerda, area de ondas a direita,
      regua de tempo no topo. Nos dois temas.
- [x] Anatomia de um **sinal de 1 bit**: nivel alto, nivel baixo, transicao, `x`,
      `z`. → 1.2.
- [x] Anatomia de um **barramento**: segmento com valor escrito, segmento estreito
      demais para o texto, valor parcialmente `x`. → 1.2 e 5.1.
- [x] **Cursor de tempo**: linha vertical, marcador na regua e a leitura textual
      dos valores. → confirmado em 8.2 ("t = 40 ns · 2º vetor de teste" com
      leitura por sinal).
- [x] **Seletor de sinais**: lista com busca, marcar/desmarcar, ordem. → 5.1,
      dropdown com "selecionar todos · limpar".
- [x] Barra de controles: zoom mais, zoom menos, ajustar a janela, ir ao
      inicio/fim. → confirmado em 8.2 (`⏮ − 100% + ⏭ ⤢`).
- [x] Estados vazios: antes da primeira simulacao; simulacao sem `.vcd`; `.vcd`
      truncado. → 5.1, cartao "O testbench não gerou formas de onda".

**Definicoes que o design ja fixou:**

- altura da faixa de sinal e espacamento entre faixas;
- espessura das linhas de onda e da grade;
- cores de nivel logico, barramento, `x`, `z`, cursor e grade, derivadas dos
  tokens e com contraste AA nos dois modos;
- tipografia da regua e dos valores dentro do barramento;
- como `x` e `z` se distinguem de `0` e `1` **sem depender de cor** (hachura,
  tracejado).

---

## 6. Projetos

**Atende:** RF07, RF08, RF15, RF20
**Status: feito.** Pagina "6 · Projetos" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-7)
(5 frames: 6.1 a 6.5); RF15 acabou desenhado na pagina "8 · Contas e acesso",
nao aqui.

- [x] Lista de projetos: nome, descricao, data de atualizacao e menu de acoes.
      → 6.1.
- [x] Lista vazia (primeiro acesso), com caminho para criar o primeiro projeto ou
      abrir um exemplo. → 6.3.
- [x] Dialogo de criacao: nome, descricao, escolha entre projeto em branco e
      exemplo. → 6.2.
- [x] Dialogo de renomear / editar descricao. → 6.2 (com aviso de nome
      duplicado).
- [x] Confirmacao de exclusao, com o nome do projeto no texto. → 6.2, mais o
      toast de desfazer em
      [10.2](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=74-2).
- [x] Estados de carregamento da lista e de erro de conexao. →
      [6.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=108-2):
      esqueleto com a forma dos cartoes reais, e "Nao foi possivel carregar
      seus projetos" mantendo os locais visiveis.
- [x] Cabecalho do workspace com projeto aberto: nome, indicador de nao salvo,
      salvar, voltar para a lista. → pagina "2 · Workspace".
- [x] Aviso de alteracoes nao salvas ao trocar de projeto. → dialogo "Sair sem
      salvar?" em 6.2.
- [x] **Exportar** (RF08): item no menu de acoes, acao equivalente no
      workspace, estado de processamento (barra com % em 6.5), erro (toast
      em 10.2), e o aviso "salve antes de exportar" a partir do workspace
      aberto — decisao nova em 6.5: como o `.zip` inclui o `.vcd` da ultima
      execucao, exportar com codigo alterado e nao executado pergunta antes
      ("Exportar assim mesmo" / "Executar e depois exportar").
- [x] **Compartilhar** (RF15): dialogo antes/depois de gerar, revogar via
      interruptor, confirmacao. → pagina "8 · Contas e acesso", 8.1.
- [x] **Projeto compartilhado**: cabecalho somente leitura, "duplicar para
      editar" (sem exigir conta, ver 8.5), link invalido/revogado (mesma
      tela, deliberadamente indistinguivel). → 8.2, 8.3 e 8.5.

**Decisao ja fechada:** a lista de projetos e pagina propria (rota), com o
mesmo cabecalho do workspace — nao aparece como dialogo sobre ele.

**Decisao ja fechada (RF15):** no modo compartilhado o editor fica bloqueado
(somente leitura); duplicar e a unica forma de editar, e duplicar nao exige
conta (ver secao de decisoes confirmadas, no fim deste documento).

---

## 7. Documentacao e onboarding

**Atende:** RF11, RF16, RF20, RNF01
**Status: feito.** Pagina "7 · Documentação e onboarding" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-8)
(7 frames: 7.1 a 7.7); galeria de exemplos (RF20) acabou na pagina "3 · Editor
de código" e "6 · Projetos", nao aqui.

- [x] Superficie de documentacao: indice a esquerda, conteudo a direita, busca.
      Nos dois temas. → 7.1 (escuro) e 7.5 (claro).
- [x] **Como a documentacao entra na tela**: decisao fechada — **pagina propria**,
      mesmo cabecalho do workspace/projetos.
- [x] Bloco de codigo dentro do conteudo: acao de copiar e acao de **abrir no
      editor** →
      [7.6](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=109-2),
      com dialogo "abrir em um projeto novo" (padrao) ou "substituir o
      conteudo atual" (destrutiva, nunca pre-selecionada) quando ha projeto
      aberto.
- [x] Estado de busca sem resultado. → mesmo frame 7.6: quando o termo e de
      fora do escopo do MVP (SystemVerilog/VHDL/sintese), o estado vazio
      aponta o equivalente em Verilog e linka "O que o TP Lab nao faz", em
      vez de um "nenhum resultado" generico.
- [x] **Galeria de exemplos** (RF20): cartao com titulo/descricao/tipo; acionada
      no editor
      ([3.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=68-2))
      e na lista vazia de projetos
      ([6.3](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=75-2)).
- [x] **Tour guiado** (RF16): 4 passos com pular/anterior/proximo (7.4), mais a
      anatomia completa do balao, o veu nos dois temas e a acao de reabrir →
      [7.7](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=110-2).
- [x] **Quadro de estados vazios**: nao existe como um unico quadro comparativo,
      mas cada estado vazio da plataforma ja foi desenhado individualmente
      (console 4.1, ondas 5.1, projetos 6.3, workspace 2.5) com a mesma
      estrutura.
- [ ] **Quadro de estados de erro**, pelo mesmo criterio — nao existe como
      quadro unico, mas cada erro individual ja tem frame proprio (ver blocos
      2, 4, 6, 8).

**Restricoes do tour:** o balao nao pode cobrir o elemento que explica; largura
fixa de 376px em vez de adaptavel (ver decisoes confirmadas). O comportamento
em 1024px continua dependendo de RNF03, que nao tem frame.

---

## 8. Contas e acesso

**Atende:** RF14, RNF06
**Status: feito.** Pagina "8 · Contas e acesso" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-9)
(5 frames: 8.1 a 8.5). Este bloco tambem absorveu o essencial de RF15
(compartilhamento), que o bloco 6 previa cobrir.

- [x] Cabecalho no estado **anonimo**: acao "Entrar com Google", discreta o
      bastante para nao sugerir que o login e obrigatorio. → 8.1.
- [x] Cabecalho no estado **autenticado**: avatar, indicador "sincronizado", menu
      com "Meus projetos na nuvem", "Preferencias" e "Sair da conta". → 8.1.
- [x] Botao de login seguindo as diretrizes de marca do Google →
      [8.4](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=103-50),
      nos dois temas, 44px de altura (minimo do Google). **Nota do proprio
      frame**: a marca desenhada e aproximacao de prototipo — a
      implementacao usa o SVG oficial do kit de marca do Google, sem
      recolorir nem alterar proporcao.
- [x] Estado de carregamento durante o retorno do OAuth. → 8.4: botao trava
      enquanto a aba do Google esta aberta; tela de retorno reaproveita 2.6.
- [x] Erros: usuario cancelou, provedor indisponivel, sessao expirada. → 8.4,
      tres cartoes — os dois primeiros com "Agora nao"/"Tentar de novo", o
      terceiro (unico vermelho) com "Entrar de novo" como acao primaria.
- [x] Dialogo "o que fazer com o trabalho local ao entrar": salvar como projeto
      novo, descartar, decidir depois. → 8.4: "Levar para a minha conta" /
      "Manter so neste navegador" / "Decidir depois" — nenhuma opcao apaga
      nada.
- [x] Aviso de sessao expirada durante o uso, com o trabalho preservado na tela.
      → mesmo cartao "Sua sessao expirou" de 8.4.
- [x] Lista de projetos no estado anonimo, deixando claro que sao locais e
      temporarios. → 8.4: chip "☁ nuvem" por projeto sincronizado, contagem
      "7 na nuvem · 3 so neste navegador".
- [x] **Sessao necessaria** (RNF06) →
      [8.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=105-2):
      "Entre para ver os projetos da nuvem", com "Ver os locais" sempre a um
      clique — nunca parede.
- [x] **Projeto/link nao encontrado**: o mesmo estado serve para link
      revogado, inexistente e mal digitado - deliberadamente
      indistinguiveis. → 8.3 (link publico) e 8.5 (mesmo principio para
      conta autenticada: "Este projeto nao esta disponivel", nunca "nao
      existe" nem "voce nao tem permissao").
- [x] Acao indisponivel: como compartilhar e exportar se apresentam para quem
      nao e o dono. → 8.5: botoes visiveis e desabilitados, com tooltip "So o
      dono pode compartilhar · Duplique para o seu navegador e o link passa a
      ser seu."

---

## 9. Editor visual de circuitos

**Atende:** RF12, RF13, RF21
**Status: avancado.** Pagina "9 · Editor visual" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-10)
(2 frames: 9.1 e 9.2). Bloco grande, so necessario se o prazo permitir chegar
na fase 11 — e o unico, alem de RNF03, que ainda nao recebeu retoques nesta
rodada.

- [x] Canvas em uso, com um circuito completo montado (AND/OR/XOR/NAND + o
      flip-flop D de RF21), no tema escuro. → 9.1. Falta confirmar o tema claro.
- [x] **Simbolo de cada bloco**: AND, OR, NOT, XOR, NAND confirmados; NOR,
      entrada, saida e constante nao confirmados na leitura de metadados.
- [ ] Estados de um bloco: repouso, hover, selecionado, com erro, arrastando —
      so "sem ligacao" (erro) confirmado, em 9.2.
- [ ] Terminais: entrada, saida, livre, conectado, alvo valido/invalido durante
      o arraste — nao confirmados.
- [x] Fio: repouso e com derivacao (um sinal alimentando mais de um destino)
      confirmados; com erro e em tracado nao confirmados.
- [x] Paleta de blocos: `PaletaDeComponentes` lateral. → 9.1.
- [ ] Controles do canvas: zoom, ajustar a tela, grade, desfazer/refazer — nao
      confirmados.
- [ ] Painel de propriedades do bloco selecionado — nao confirmado.
- [x] Marcacao de erro de validacao e lista de problemas. → 9.2.
- [ ] Canvas vazio (primeiro uso), com instrucao inicial — nao confirmado.
- [ ] **Convivencia codigo x circuito** no workspace, em 1024 px — depende de
      RNF03, que nao tem frame ainda.
- [x] **Previa do codigo gerado** ao lado do canvas (RF13) - alternancia
      "Modo Codigo" / "Editar como codigo", somente leitura no modo Blocos
      ("este codigo e regerado a cada mudanca"). → 9.1.
- [x] Distincao **erro trava a geracao; aviso nao** (`CódigoBloqueado`),
      resolvendo por que o estudante ainda ve Verilog de um circuito
      parcialmente montado. Confirmacao de sobrescrita e indicador de
      sincronia com os 4 estados nomeados nao confirmados como componente
      isolado.
- [x] **Sequenciais** (RF21): flip-flop D montado no canvas. → 9.1. Terminais
      de clock/reset isolados, fio de clock distinguivel sem cor, e um
      contador de 4 bits como frame de referencia proprio ainda nao
      confirmados.

**Decisoes que o design precisa fixar:**

- simbolos no padrao distintivo (IEEE 91, formatos caracteristicos) ou retangular
  (IEC)? Afeta o reconhecimento pelo aluno;
- tamanho da grade e alinhamento (snap);
- dimensoes de cada bloco e distancia minima entre terminais, para o alvo de
  clique ser confortavel;
- o flip-flop e de 1 bit (quatro deles para um contador de 4 bits, ensina mais e
  polui o canvas) ou um registrador de largura configuravel (pratico, esconde o
  conceito)?

---

## 10. Avulsos

**Status: feito.** Pagina "10 · Avulsos" em
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-11)
(5 frames: 10.1 a 10.5).

- [x] **Feedback** (RF17): ponto de acesso na barra de estado (decisao fechada:
      nunca botao flutuante); formulario com tipo, mensagem e interruptor de
      contexto tecnico (10.1); detalhe expansivel do contexto, validacao,
      estados de envio/sucesso/erro e limite atingido →
      [10.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=111-2).
- [x] **Metricas** (RF19): banner de consentimento no fim da primeira execucao
      bem-sucedida, lista do que e/nao e enviado, aceitar/recusar; preferencia
      revogavel depois em
      [10.3](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=86-2). →
      10.1 + 10.3.
- [x] **Navegador nao suportado** (RNF02): aviso informativo que **nao bloqueia**
      o uso →
      [10.4](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=103-2),
      faixa dispensavel + lista de navegadores testados + o argumento
      registrado no proprio frame de por que bloquear contrariaria RF01.

**Extra, alem do escopo original deste bloco:**

- [10.2 · Confirmações e desfazer](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=74-2) -
  regra de posicionamento de toasts (canto inferior direito, no maximo 3),
  exclusao com desfazer de 8 segundos (RF07), toasts de exportacao e link
  copiado (RF08/RF15), toast de falha com acao corretiva.
- [10.3 · Preferências](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=86-2) -
  dialogo com tema (RF10), tamanho do texto do editor, aviso ao sair sem
  salvar, autocompletar (RF18), limites de execucao **visiveis mas fixos**
  (RNF05 - "o valor esta aqui para ser consultado, nao mexido") e metricas
  (RF19).

---

## Restricoes que valem para tudo

- Componentes **apenas** do shadcn/ui, estilo `new-york`. Nao ha MUI, Chakra ou
  outra biblioteca no projeto e nao deve haver.
- Cores **sempre** por token de tema, nunca hexadecimal solto - e o que faz o
  claro/escuro funcionar sem duplicar a paleta.
- Contraste WCAG AA nos **dois** modos (RNF09).
- Nenhuma informacao comunicada apenas por cor (diagnosticos, niveis logicos,
  estados de execucao).
- Foco visivel em todo elemento navegavel por teclado.
- Largura util minima de 1024 px (RNF03); validar sempre nessa largura primeiro.
- Textos de interface em portugues, seguindo o glossario do bloco 1.

---

## Decisoes de design ja fechadas (seguir exatamente, nao redecidir no codigo)

Registradas pelo autor do Figma como decisoes deliberadas — cada uma resolve
um ponto que teria virado ambiguidade ou retrabalho na implementacao.

1. **Duplicar nao exige conta; compartilhar exige.** Um link publico precisa
   de dono para poder ser revogado depois. Uma copia no navegador de quem
   clicou nao precisa de nada — pedir cadastro ali seria no ponto de menor
   paciencia do funil. Ver RF15/RNF06, frame
   [8.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=105-2).
2. **O aviso de navegador nao suportado nao bloqueia.** Uma tela de bloqueio
   trocaria "instale o Vivado" por "instale outro navegador" — mesma
   barreira, roupa diferente. Em laboratorio de universidade, quem tem
   navegador desatualizado normalmente nao pode atualiza-lo. Ver RNF02,
   frame
   [10.4](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=103-2).
3. **O veu do tour e preto nos dois temas**, nunca branco. Veu branco sobre
   tema claro lava a tela e apaga o realce junto. Muda so a opacidade: 68%
   no escuro, 50% no claro. Ver RF16, frame
   [7.7](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=110-2).
4. **Exportar a partir do workspace aberto pergunta antes.** O `.zip` inclui
   o `.vcd` da ultima execucao, entao exportar com codigo alterado e nao
   executado entregaria um pacote internamente inconsistente — codigo novo
   com onda velha. Dialogo "Exportar assim mesmo" / "Executar e depois
   exportar". Ver RF08, frame
   [6.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=108-2).
5. **A marca do Google em 8.4 e aproximacao de prototipo.** Na implementacao,
   usar o SVG oficial do kit de marca do Google — sem recolorir, sem alterar
   proporcao ou espacamento. E condicao de uso da identidade deles, anotada
   dentro do proprio frame
   [8.4](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=103-50).

---

## Pendencias que ainda bloqueiam a execucao total do MVP

Levantamento atualizado depois da segunda rodada de frames (2.9, 3.2, 4.2,
6.5, 7.6, 7.7, 8.4, 8.5, 10.4, 10.5). Praticamente tudo o que faltava foi
fechado nesta rodada. Sobra um unico bloqueador real, mais os retoques do
editor visual, que so importam se a Fase 11 entrar no cronograma.

### 1 — O unico ponto que ainda trava o inicio de uma fase inteira

- [ ] **RNF03 · Responsividade — nenhum frame existe.** Toda tela do arquivo
      (Workspace, Editor, Console, Ondas, Projetos, Documentacao, Contas,
      Editor visual, Avulsos) existe **so em 1920px**. Falta:
      - o frame de **1024px do Workspace** (o mais apertado — e o que decide
        o design, ver Bloco 2);
      - a decisao central: abaixo de 1024px, o layout mantem rolagem
        horizontal (o que o codigo faz hoje), empilha os paineis, ou mostra
        um de cada vez;
      - o frame de **1366px**, intermediario;
      - largura minima de cada painel com conteudo real dentro (linha de
        Verilog tipica, diagnostico completo, coluna de nomes + trecho de
        tempo do painel de ondas);
      - como o divisor de painel (2.9), o dialogo de atalhos, o tour (7.7) e
        o editor visual (bloco 9) se comportam nessa largura.
      Sem isso, RF09-I01 (a issue que abre a Fase 5) nao tem o que
      implementar, e RNF03-I01/I02 ficam completamente parados. E o unico
      bloco deste documento com **zero** cobertura.

### 2 — Podem esperar (Should/Could Have, Fases 9-12 do README)

So relevante se o cronograma chegar la — nao bloqueiam o MVP funcional. Unico
bloco, alem de RNF03, ainda com lacunas:

- **RF12 / Editor visual**: estados de interacao dos blocos (hover,
  selecionado, arrastando), terminais (alvo valido/invalido durante o
  arraste), controles do canvas (zoom, ajustar, grade/snap,
  desfazer/refazer), painel de propriedades do bloco selecionado, canvas
  vazio no primeiro uso.
- **RF13**: indicador de sincronia com os 4 estados nomeados (em dia,
  desatualizado, editado a mao, divergente) como componente isolado; realce
  da correspondencia bloco ↔ linha de codigo.
- **RF21**: terminais de clock/reset isolados dos terminais de dado; fio de
  clock distinguivel sem depender so de cor; um contador de 4 bits completo
  como frame de referencia proprio.

### Resumo para priorizar

**RNF03 e a unica pendencia que bloqueia o inicio de uma fase do plano** —
todo o resto do MVP (Must Have e Should Have) tem design completo,
incluindo a cadeia critica de publicacao (RF07 → RF14 → RNF06 → RF01). Depois
de RNF03, so resta o editor visual (bloco 9), e apenas se a Fase 11 entrar no
escopo.

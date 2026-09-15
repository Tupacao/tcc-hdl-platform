# Bloco 1 — Fundamentos (design system)

**Atende:** RF10, RNF09, RNF01, RNF03
**Status:** publicado no Figma, contrastes verificados por cálculo (fórmula de luminância relativa WCAG 2.1). Ver
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=33-2),
página "1 · Fundamentos" (frames 1.1 a 1.4).

Este documento fecha os seis itens do bloco 1 de `FIGMA-PROTOTIPOS.md`. Ele é a
fonte dos valores que devem entrar em `apps/web/src/index.css` — se o arquivo
atual divergir, este documento prevalece e o CSS é ajustado, não o contrário.

Identidade: **laranja, preto e branco**. O laranja é reservado à ação primária e
ao destaque de sintaxe; preto e branco carregam superfície e texto.

---

## 1. Tokens de cor

Nomes conforme shadcn/ui, estilo `new-york`.

| Token | Claro | Escuro | Onde é usado |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#0B0B0E` | Fundo raiz da aplicação |
| `--foreground` | `#0B0B0E` | `#FFFFFF` | Texto primário |
| `--card` | `#FFFFFF` | `#131318` | Painéis do workspace, cartões de projeto |
| `--card-foreground` | `#0B0B0E` | `#FFFFFF` | Texto sobre cartão |
| `--popover` | `#FFFFFF` | `#212129` | Diálogos, menus, tooltips, autocompletar |
| `--popover-foreground` | `#0B0B0E` | `#FFFFFF` | Texto sobre popover |
| `--primary` | `#FF6A00` | `#FF6A00` | Preenchimento da ação primária (Executar) |
| `--primary-foreground` | `#0B0B0E` | `#0B0B0E` | Texto sobre o preenchimento laranja |
| `--primary-strong` * | `#B23A0A` | `#FF9A4D` | Laranja como **texto ou ícone** |
| `--secondary` | `#F1F1F4` | `#1F1F27` | Botão secundário, aba inativa |
| `--secondary-foreground` | `#0B0B0E` | `#FFFFFF` | Texto sobre secundário |
| `--muted` | `#F1F1F4` | `#1A1A21` | Cabeçalho de painel, régua de linha |
| `--muted-foreground` | `#57575F` | `#A0A0AE` | Texto secundário, legendas |
| `--accent` | `#EFEFF2` | `#2B2B35` | Superfície de hover e item selecionado |
| `--accent-foreground` | `#0B0B0E` | `#FFFFFF` | Texto sobre accent |
| `--destructive` | `#C81E1E` | `#FF6B6B` | Erro: texto, ícone e preenchimento |
| `--destructive-foreground` | `#FFFFFF` | `#0B0B0E` | Texto sobre preenchimento destrutivo |
| `--success` | `#15803D` | `#34D399` | Execução concluída sem erros |
| `--warning` | `#9A5B08` | `#FBBF24` | Aviso do `iverilog` |
| `--border` | `#E2E2E7` | `#2B2B35` | Divisória **decorativa** entre painéis |
| `--input` | `#84848E` | `#6B6B7D` | Contorno de controle de formulário |
| `--ring` | `#C2410C` | `#FF8A3D` | Anel de foco, sempre com deslocamento |

\* `--primary-strong` é token novo. Existe porque `--primary` **reprova** como
texto no tema claro (ver §2). Sem ele, links e ícones laranja no claro ficam
ilegíveis ou o laranja da marca precisa ser abandonado.

### Três decisões embutidas na tabela

**`--primary` é idêntico nos dois temas.** O laranja da marca não muda; o que
muda é o token usado para texto (`--primary-strong`). Isso mantém o botão
Executar visualmente igual no claro e no escuro.

**`--primary-foreground` é preto, não branco.** Branco sobre `#FF6A00` fica em
3,0:1 e reprova. Preto fica em 6,85:1. É também o que dá ao botão o contraste
característico da paleta.

**`--border` e `--input` são separados de propósito.** O documento levantou a
suspeita de que a borda no escuro não atinge 3:1 — e não atinge mesmo, nem no
claro. Isso é correto: o critério 1.4.11 do WCAG exige 3:1 apenas de elementos
que **delimitam um controle**, não de divisórias decorativas. Então `--border`
permanece discreto para separar painéis, e `--input` carrega o contraste dos
contornos de campo, botão-contorno e caixa de seleção. Substituir o antigo
branco a 12% / 18% de opacidade por valores opacos torna o cálculo auditável.

---

## 2. Razões de contraste verificadas

Limiar: **4,5:1** para texto normal, **3:1** para texto grande (≥18,66px negrito
ou ≥24px) e para elementos não textuais.

### Tema claro

| Par | Razão | Veredito |
|---|---|---|
| `foreground` sobre `background` | 19,65 | AAA |
| `card-foreground` sobre `card` | 19,65 | AAA |
| `popover-foreground` sobre `popover` | 19,65 | AAA |
| `primary-foreground` sobre `primary` | 6,85 | AA |
| `secondary-foreground` sobre `secondary` | 17,44 | AAA |
| `muted-foreground` sobre `background` | 7,16 | AAA |
| `muted-foreground` sobre `card` | 7,16 | AAA |
| `muted-foreground` sobre `muted` | 6,35 | AA |
| `accent-foreground` sobre `accent` | 17,13 | AAA |
| `destructive-foreground` sobre `destructive` | 5,74 | AA |
| `destructive` sobre `background` / `card` | 5,74 | AA |
| `success` sobre `background` / `card` | 5,02 | AA |
| `warning` sobre `background` / `card` | 5,42 | AA |
| `primary-strong` sobre `background` | 6,00 | AA |
| `input` sobre `background` | 3,70 | AA não-texto |
| `input` sobre `secondary` | 3,28 | AA não-texto |
| `ring` sobre `background` | 5,18 | AA não-texto |
| ~~`primary` sobre `background`~~ | 2,87 | **REPROVA — uso proibido** |
| `border` sobre `background` | 1,29 | decorativo, isento |

### Tema escuro

| Par | Razão | Veredito |
|---|---|---|
| `foreground` sobre `background` | 19,65 | AAA |
| `card-foreground` sobre `card` | 18,52 | AAA |
| `popover-foreground` sobre `popover` | 15,98 | AAA |
| `primary-foreground` sobre `primary` | 6,85 | AA |
| `secondary-foreground` sobre `secondary` | 16,36 | AAA |
| `muted-foreground` sobre `background` | 7,61 | AAA |
| `muted-foreground` sobre `card` | 7,17 | AAA |
| `muted-foreground` sobre `muted` | 6,70 | AA |
| `accent-foreground` sobre `accent` | 14,00 | AAA |
| `destructive-foreground` sobre `destructive` | 7,08 | AAA |
| `destructive` sobre `background` | 7,08 | AAA |
| `destructive` sobre `card` | 6,67 | AA |
| `success` sobre `background` / `card` | 10,22 / 9,63 | AAA |
| `warning` sobre `background` / `card` | 11,77 / 11,09 | AAA |
| `primary` sobre `background` / `card` | 6,85 / 6,45 | AA |
| `primary-strong` sobre `background` | 9,34 | AAA |
| `input` sobre `background` | 3,77 | AA não-texto |
| `input` sobre `card` | 3,55 | AA não-texto |
| `input` sobre `popover` | 3,06 | AA não-texto |
| `ring` sobre `background` | 8,38 | AA não-texto |
| `border` sobre `background` | 1,40 | decorativo, isento |

### O anel de foco sobre o botão laranja

`ring` sobre `primary` fica em 1,80 (claro) e 1,22 (escuro): um anel desenhado
diretamente na borda do botão Executar seria invisível. A solução é a que o
shadcn já usa por padrão — `ring-2 ring-offset-2 ring-offset-background`. O
deslocamento de 2px na cor do fundo faz o anel encostar no `background`, e é
contra ele que o contraste é medido: 5,18 no claro e 8,38 no escuro. **O
deslocamento não é opcional**; sem ele o foco reprova em toda ação primária.

---

## 3. Tokens novos para forma de onda (RF06)

Não existem hoje. São gráfico, não texto, então o limiar é 3:1 — mas todos os
valores abaixo passam com folga porque a linha é fina e precisa de margem.

| Token | Claro | Escuro | Contraste (claro / escuro) |
|---|---|---|---|
| `--wave-level` | `#0369A1` | `#38BDF8` | 5,93 / 8,64 |
| `--wave-bus` | `#B23A0A` | `#FF9A4D` | 6,00 / 8,80 |
| `--wave-x` | `#C81E1E` | `#FF6B6B` | 5,74 / 6,67 |
| `--wave-z` | `#57575F` | `#A0A0AE` | 7,16 / 7,17 |
| `--wave-cursor` | `#C2410C` | `#FF6A00` | 5,18 / 6,45 |
| `--wave-grid` | `#EFEFF2` | `#22222B` | 1,15 / 1,17 — decorativo |
| `--wave-ruler-foreground` | `#57575F` | `#8A8A98` | texto da régua, AA |

### Como `x` e `z` se distinguem sem depender de cor

Exigência do RNF09; a cor sozinha não pode carregar a informação.

- **`0` e `1`** — linha cheia, no nível baixo e alto da faixa.
- **`x` (indefinido)** — faixa preenchida com **hachura diagonal a 45°** em
  `--wave-x`, ocupando a altura toda. A textura é o sinal; a cor reforça.
- **`z` (alta impedância)** — linha **tracejada** no meio da faixa, em
  `--wave-z`. A posição central já é única: nenhum outro estado desenha no meio.
- **Barramento** — hexágono com o valor escrito dentro. Quando o segmento é
  estreito demais para o texto, o valor é omitido e o hexágono permanece; o
  valor aparece na leitura do cursor.
- **Barramento parcialmente `x`** — hachura no segmento e valor escrito com os
  bits indefinidos como `x` (ex.: `10xx`).

---

## 4. Tipografia

### Interface

| Papel | Família | Tamanho / altura | Peso |
|---|---|---|---|
| Título de tela | Inter | 30 / 1,25 | Bold |
| Título de seção | Inter | 22 / 1,30 | Semi Bold |
| Título de painel | Inter | 14 / 1,40 | Semi Bold |
| Corpo | Inter | 15 / 1,55 | Regular |
| Rótulo e apoio | Inter | 13 / 1,45 | Regular |
| Legenda | Inter | 12 / 1,40 | Medium |

### Editor (RF02)

- **JetBrains Mono 13px, altura de linha 22px.** Os 22px são o valor que a régua
  de números, os marcadores de diagnóstico e a linha atual compartilham — mudar
  um exige mudar os três.
- Fallback: `ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace`.
- Régua de números: 12px, `--muted-foreground`, alinhada à direita, coluna de
  40px.

### Conteúdo longo (RF11)

Coluna de leitura com máximo de **72ch**; abaixo disso o texto vira parede.

| Elemento | Tamanho / altura | Observação |
|---|---|---|
| h1 | 30 / 1,25 | um por página |
| h2 | 22 / 1,30 | margem superior de 40px |
| h3 | 18 / 1,40 | margem superior de 28px |
| Parágrafo | 16 / **1,70** | altura maior que a da interface, de propósito |
| Lista | 16 / 1,70 | recuo de 24px, marcador em `--muted-foreground` |
| Tabela | 14 / 1,50 | cabeçalho Semi Bold, linhas separadas por `--border` |
| Código em linha | mono 14 | fundo `--muted`, raio 4, padding 2/5 |
| Bloco de código | mono 13 / 22 | mesma métrica do editor |
| Nota / aviso | 15 / 1,60 | barra lateral de 3px em `--primary-strong` |

---

## 5. Densidade (RNF01)

O público é iniciante: erra mais o clique, lê mais devagar e se perde em
interface apertada. Os valores abaixo são mais generosos do que o padrão do
shadcn e isso é intencional.

- **Escala de espaçamento:** múltiplos de 4 — 4, 8, 12, 16, 20, 24, 32, 40, 64.
- **Alvo de clique mínimo: 40 × 40px.** O mínimo do WCAG 2.2 é 24 × 24; 40
  é o que evita o erro de mira em botão de barra de ferramentas.
- **Altura dos controles:** botão e campo com 40px; versão compacta de 32px
  permitida **apenas** dentro de barras de painel, nunca em ação primária.
- **Espaço entre alvos adjacentes:** mínimo de 8px.
- **Tamanho mínimo de fonte:** 12px, e só para régua de tempo e números de
  linha. Nenhum texto de conteúdo abaixo de 13px.
- **Raios:** 6 (chip, código em linha) · 8 (botão, campo) · 12 (cartão, painel)
  · 999 (pill).
- **Foco:** anel de 2px em `--ring` com deslocamento de 2px em
  `--ring-offset-background`, em todo elemento navegável por teclado.

---

## 6. Glossário de interface (RNF01-I01)

Um termo por conceito, em toda a interface, documentação e mensagens de erro.

| Conceito | Termo adotado | Nunca usar |
|---|---|---|
| Conjunto salvo de arquivos + metadados | **projeto** | sketch, arquivo, workspace |
| Arquivo que descreve o hardware | **circuito** | design, DUT, unidade sob teste |
| Arquivo que exercita o circuito | **testbench** | banco de testes, teste, bancada |
| Módulo instanciado pelo testbench | **módulo principal** | top module, módulo de topo |
| Traduzir o código para forma executável | **compilar** | build, montar |
| Rodar o testbench e produzir os sinais | **simular** | rodar, testar |
| Ação única do usuário: compilar + simular | **Executar** | Rodar, Play, Compilar e simular |
| Gráfico de sinais ao longo do tempo | **forma de onda** | waveform, gráfico, timing |
| Erro ou aviso vindo do compilador | **erro** / **aviso** | diagnóstico, issue, problema |
| Painel que reúne erros e avisos | **Problemas** | Diagnósticos, Console de erros |
| Saída textual bruta da execução | **Console** | terminal, log, output |

### Consequência para a interface

**Existe um único botão de ação primária, rotulado "Executar".** Compilar e
simular são as duas *fases* daquela ação e aparecem como estado do botão e da
barra de estado, nunca como dois botões. Duas ações separadas obrigariam o
iniciante a saber que compilação precede simulação — exatamente a barreira que a
plataforma quer remover.

`diagnóstico` permanece apenas como termo de código (tipo TypeScript, nome de
endpoint). O usuário lê "erro", "aviso" e "Problemas".

---

## 7. Bloco CSS resultante

```css
:root {
  --background: #FFFFFF;              --foreground: #0B0B0E;
  --card: #FFFFFF;                    --card-foreground: #0B0B0E;
  --popover: #FFFFFF;                 --popover-foreground: #0B0B0E;
  --primary: #FF6A00;                 --primary-foreground: #0B0B0E;
  --primary-strong: #B23A0A;
  --secondary: #F1F1F4;               --secondary-foreground: #0B0B0E;
  --muted: #F1F1F4;                   --muted-foreground: #57575F;
  --accent: #EFEFF2;                  --accent-foreground: #0B0B0E;
  --destructive: #C81E1E;             --destructive-foreground: #FFFFFF;
  --success: #15803D;                 --warning: #9A5B08;
  --border: #E2E2E7;                  --input: #84848E;
  --ring: #C2410C;                    --ring-offset-background: #FFFFFF;

  --wave-level: #0369A1;              --wave-bus: #B23A0A;
  --wave-x: #C81E1E;                  --wave-z: #57575F;
  --wave-cursor: #C2410C;             --wave-grid: #EFEFF2;
  --wave-ruler-foreground: #57575F;

  --code-foreground: #1C1C22;         --code-keyword: #B23A0A;
  --code-type: #9A3412;               --code-directive: #7C3AED;
  --code-number: #0369A1;             --code-string: #15803D;
  --code-comment: #5F6570;            --code-operator: #1C1C22;
}

.dark {
  --background: #0B0B0E;              --foreground: #FFFFFF;
  --card: #131318;                    --card-foreground: #FFFFFF;
  --popover: #212129;                 --popover-foreground: #FFFFFF;
  --primary: #FF6A00;                 --primary-foreground: #0B0B0E;
  --primary-strong: #FF9A4D;
  --secondary: #1F1F27;               --secondary-foreground: #FFFFFF;
  --muted: #1A1A21;                   --muted-foreground: #A0A0AE;
  --accent: #2B2B35;                  --accent-foreground: #FFFFFF;
  --destructive: #FF6B6B;             --destructive-foreground: #0B0B0E;
  --success: #34D399;                 --warning: #FBBF24;
  --border: #2B2B35;                  --input: #6B6B7D;
  --ring: #FF8A3D;                    --ring-offset-background: #0B0B0E;

  --wave-level: #38BDF8;              --wave-bus: #FF9A4D;
  --wave-x: #FF6B6B;                  --wave-z: #A0A0AE;
  --wave-cursor: #FF6A00;             --wave-grid: #22222B;
  --wave-ruler-foreground: #8A8A98;

  --code-foreground: #E4E4E7;         --code-keyword: #FF8A3D;
  --code-type: #FFA866;               --code-directive: #C084FC;
  --code-number: #38BDF8;             --code-string: #4ADE80;
  --code-comment: #7B8290;            --code-operator: #C7C7CE;
}
```

---

## 8. Destaque de sintaxe Verilog

O Monaco entra com tema customizado: os temas `vs` e `vs-dark` padrão não foram
construídos sobre esta paleta e não há garantia de AA sobre `--card`.

| Escopo | Claro | Escuro |
|---|---|---|
| Texto normal | `#1C1C22` | `#E4E4E7` |
| Palavra-chave (`module`, `assign`, `always`) | `#B23A0A` | `#FF8A3D` |
| Tipo (`wire`, `reg`, `input`, `output`) | `#9A3412` | `#FFA866` |
| Tarefa de sistema / diretiva (`$display`, `` `timescale ``) | `#7C3AED` | `#C084FC` |
| Número e literal (`4'b1010`) | `#0369A1` | `#38BDF8` |
| String | `#15803D` | `#4ADE80` |
| Comentário | `#5F6570` | `#7B8290` |
| Operador | `#1C1C22` | `#C7C7CE` |
| Fundo do editor | `#FAFAFB` | `#0F0F14` |
| Número de linha | `#84848E` | `#5A5A66` |
| Linha atual | `#F1F1F4` | `#17171E` |
| Seleção | `#FFE3CC` | `#3A2A18` |
| Linha com erro | `#FEF2F2` | `#1C1013` |

Palavra-chave em laranja não é decoração: amarra o destaque de sintaxe à
identidade sem introduzir uma sétima cor no sistema.

**Estado da implementação (RF11).** As oito primeiras linhas da tabela (texto
normal, palavra-chave, tipo, tarefa de sistema/diretiva, número, string,
comentário, operador) viraram tokens `--code-*` em `apps/web/src/index.css` e
alimentam um destacador leve por expressão regular em
`apps/web/src/features/docs/components/code-block.tsx` — sem dependência
nova, os blocos de código da documentação são só leitura e curtos, então um
tokenizador simples é suficiente. As quatro últimas linhas (fundo do editor,
número de linha, linha atual, seleção, linha com erro) são específicas do
Monaco e permanecem pendentes: `apps/web/src/lib/monaco.ts` ainda usa os
temas padrão `vs`/`vs-dark`, sem o tema customizado que esta seção pede
(RF02, fora do escopo desta correção).

# RF05-I03 - Explicacoes em portugues para erros frequentes

| Campo | Valor |
| --- | --- |
| Feature | [RF05](feature.md) |
| Branch | `feat/rf05-mensagens-amigaveis` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF05-I01 |

## Contexto

As mensagens do `iverilog` sao em ingles, escritas para quem ja conhece a
linguagem: `Unknown module type: fulladder`, `syntax error`,
`I give up.`, `port ... is not connected`. Para o publico-alvo do TPLab -
estudante em primeiro contato com HDL - boa parte delas nao comunica o que fazer.

`DiagnosticSchema` ja preserva a linha original em `raw`, o que permite adicionar
uma explicacao **sem substituir** a mensagem da ferramenta. Isso importa: o aluno
precisa aprender a ler saida de compilador, nao a depender de uma traducao.

## Objetivo

Anexar, aos erros mais frequentes, uma explicacao curta em portugues que diga a
causa provavel e a acao seguinte, mantendo visivel a mensagem original.

## Escopo tecnico

- `packages/shared/src/schemas/simulation.ts` - campo `hint` opcional no
  `DiagnosticSchema`.
- `apps/api/src/modules/simulation/hints.ts` (novo) - catalogo de padroes.
- `apps/api/src/worker.ts` - enriquecer os diagnosticos antes de devolver.
- `apps/web/src/features/workspace/console-panel.tsx` - exibicao da explicacao.

## Passo a passo

1. Adicionar `hint: z.string().nullable()` ao `DiagnosticSchema` (default `null`)
   e rodar `pnpm --filter @tplab/shared build`.
2. Criar um catalogo de regras `{ pattern: RegExp, hint: string }` cobrindo, no
   minimo:
   - `Unknown module type: X` - o modulo `X` nao foi encontrado; conferir se o
     nome no design e na instanciacao do testbench e o mesmo.
   - `syntax error` - erro de escrita na linha ou imediatamente antes; conferir
     `;`, `end`, `endmodule`.
   - `I give up.` - o compilador parou depois de erros anteriores; corrigir o
     primeiro erro da lista antes dos demais.
   - `is not connected` - porta declarada e nao ligada na instanciacao.
   - `Port ... is not a port of` - nome de porta divergente entre design e
     testbench.
   - largura de vetor incompativel - checar `[N:0]` dos dois lados.
   - `sorry:` - construcao nao suportada pelo Icarus Verilog, nao erro do codigo.
3. Escrever cada texto em uma frase, no imperativo, sem jargao e sem prometer
   certeza ("provavelmente", quando for heuristica).
4. Enriquecer os diagnosticos no worker, apos o parse: primeira regra que casar
   vence; nenhuma regra casando deixa `hint` em `null`.
5. No `ConsolePanel`, exibir a explicacao abaixo da mensagem, com peso visual
   menor, mantendo a mensagem original sempre visivel.
6. Cobrir o catalogo com testes: uma entrada por regra, mais um caso sem regra
   correspondente.
7. Reaproveitar os mesmos textos na referencia de sintaxe de RF11.

## Criterios de aceite

- [x] Cada uma das regras do catalogo tem teste e produz a explicacao esperada.
      _(back - `hints.test.ts`)_
- [ ] A mensagem original do `iverilog` continua visivel ao lado da explicacao.
      _(front - pendente)_
- [ ] Diagnostico sem regra correspondente aparece normalmente, sem espaco vazio
      nem texto generico. _(front - pendente)_
- [x] Os textos estao em portugues, em uma frase, orientados a acao.
- [ ] A explicacao nao quebra o layout do console com listas longas.
      _(front - pendente)_

## Nota de implementacao

- **Branch dividida em back e front** (`feat-RF05-03-mensagens-amigaveis-back`
  primeiro, front depois) seguindo `docs/WORKFLOW.md#1` - a tarefa toca
  `packages/shared`, `apps/api` e `apps/web`, e front/back nunca vao na mesma
  branch. O front (exibicao no `ConsolePanel`) depende do campo `hint` ja
  existir no contrato, entao so comeca depois deste PR mesclado.
- **Duas regras do "passo a passo" nao entraram no catalogo por nao serem
  reais** - verificado rodando o `tplab-sandbox:latest` de proposito, mesmo
  principio ja aplicado em RF05-I01 (onde "divisao por zero e erro" tambem se
  provou falso):
  - `is not connected` (porta declarada e nao ligada): testado com porta
    omitida por nome (`.b()`) e por posicao (`dut(a, , y)`) - o Icarus (sem
    `-Wall`, que `run-simulation.sh` nao passa) nunca emite aviso nenhum,
    so calcula `x` em silencio. Regra removida do catalogo; nenhum padrao
    real para cobrir.
  - `sorry:` como prefixo do padrao: o prefixo `sorry:` e removido de
    `message` pelo proprio parser (vira parte de como `severity` e
    calculado, ver `SEVERITY_PREFIX` em `diagnostics.ts`) - um padrao
    `/^sorry:/` contra `message` nunca bateria. Corrigido para casar o texto
    que de fato sobra (`/not currently supported/i`), confirmado rodando um
    `let` (construcao SystemVerilog) de proposito contra o sandbox real:
    `sorry: let declarations (my_and) are not currently supported.`
  - As outras cinco regras batem contra fixtures reais ja capturadas em
    RF05-I01 (`Unknown module type`, `syntax error`, `I give up.`,
    `is not a port of`, `expects N bits, got M`).
- **Gap descoberto no Figma, fora do escopo tecnico desta issue** (node
  `48:2`, "TooltipErro (RF05)"): o design mostra a explicacao aparecendo
  tambem num popup fixado na linha do erro dentro do proprio editor (titulo
  por categoria, ex. "Erro de sintaxe", posicao, texto da explicacao, caixa
  com a saida bruta) - **alem** de um botao de correcao automatica
  ("Inserir o ponto e virgula") e o link "Ver na documentacao". O botao de
  correcao automatica esta explicitamente fora do escopo de RF05
  (`feature.md`, secao "Fora"); o link de documentacao ja e pendencia
  separada (RF05 x RF11). O popup em si (tooltip no editor) e uma peca nova,
  estrutural, nao mencionada no escopo tecnico desta issue (que fala so em
  `console-panel.tsx`) - mesma logica do gap da aba "Problemas" registrado em
  `issue-02`. Adiado, nao esquecido.
  - No console (nao no popup), o Figma inverte a hierarquia visual que o
    "passo a passo" desta issue descreve: la, a explicacao e o texto
    principal (branco) e a mensagem original do iverilog vira a linha
    secundaria (cinza, menor, prefixada com "iverilog:"), nao o contrario. O
    front desta issue segue o Figma quando entrar em conflito com o texto do
    passo 5 - `docs/WORKFLOW.md` e explicito que o design manda nesse tipo de
    decisao.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api test
pnpm typecheck
```

Manual: escrever os seis erros do catalogo, um por vez, e conferir cada texto.

## Riscos

- Explicacao errada e pior que explicacao nenhuma: quando a regra e heuristica, o
  texto precisa dizer isso. Evitar afirmar causa unica para `syntax error`, que
  costuma apontar a linha seguinte ao erro real.
- O catalogo tende a crescer sem criterio; manter a regra de so entrar padrao que
  apareceu de fato em uso, nunca por suposicao.

## Decisao de design (Figma 2.3) - manchete em portugues, mensagem original em segundo plano

Esta issue foi entregue primeiro como pedia o texto acima (mensagem original em
destaque, "Dica:" abaixo). Ao conferir o Figma (frame
[2.3](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=48-2)),
a hierarquia era a inversa, e a decisao foi **seguir o Figma**:

- Cada diagnostico com regra no catalogo traz um **`title`** (manchete curta em
  portugues, ex.: "Erro de sintaxe", "O modulo baz nao foi encontrado") alem do
  `hint` (explicacao e proxima acao). `DiagnosticSchema` ganhou
  `title: z.string().nullable()`.
- O console mostra o `title` como manchete, o `hint` abaixo e, na mesma linha,
  a **mensagem original da ferramenta** em fonte monoespacada - continua
  visivel, como a issue exigia, mas deixa de ser a primeira coisa que o
  iniciante le. "Ir para a linha" vira botao a direita da linha.
- Sem regra no catalogo (`title: null`), o console mostra so a mensagem original,
  como antes.
- Titulos e dicas sao conservadores ("Provavelmente falta um ;"): uma manchete
  errada seria pior que a mensagem crua. Texto com acentuacao correta.
- Entregue junto (mesma branch, por decisao explicita): contrato compartilhado,
  catalogo no back e console no front - excecao consciente a regra de front e
  back em PRs separados.

**Abas Console / Problemas (entregues na mesma branch, depois de questionado):**
o painel inferior tem duas abas, como no Figma 2.3 e 4.1. **Console** mostra a
saida bruta do compilador e o stdout; **Problemas** mostra a lista estruturada
(tabela "ARQUIVO E POSICAO / MENSAGEM", com o selo de contagem - vermelho com
erros, ambar so com avisos, neutro em zero). Depois de cada execucao, com
diagnosticos abre Problemas; sem nenhum, Console. So avisos: confirmacao verde
"0 erros · a simulacao rodou normalmente". As abas seguem o padrao ARIA
(`tablist`/`tab`/`tabpanel`, setas, Home/End). O aviso
`@* found no sensitivities` entrou no catalogo (saida real, texto do Figma).

**Adiado (ainda no Figma):** "Copiar saida" / "Limpar" no cabecalho das abas, saida
em fluxo com cursor piscando e botao "Cancelar" (RF04-I03), botao "ir para o fim"
em saida longa, a correcao rapida "Inserir o ponto e virgula" e o tooltip do erro
no editor. A barra de estado fica em RF09-I03.

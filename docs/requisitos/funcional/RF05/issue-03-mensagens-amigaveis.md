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

- [ ] Cada uma das regras do catalogo tem teste e produz a explicacao esperada.
- [ ] A mensagem original do `iverilog` continua visivel ao lado da explicacao.
- [ ] Diagnostico sem regra correspondente aparece normalmente, sem espaco vazio
      nem texto generico.
- [ ] Os textos estao em portugues, em uma frase, orientados a acao.
- [ ] A explicacao nao quebra o layout do console com listas longas.

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

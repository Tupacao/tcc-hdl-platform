# RNF01-I01 - Glossario e revisao dos textos de interface

| Campo | Valor |
| --- | --- |
| Feature | [RNF01](feature.md) |
| Branch | `chore/rnf01-vocabulario-e-textos` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

Os textos da interface foram escritos aos poucos, cada um decidindo seus proprios
termos. Hoje convivem, por exemplo, "Arquivos do projeto" no `role="tablist"`,
"design" e "testbench" como nomes de aba, "Erro de compilacao" no console e
"Compilando e simulando..." no estado de execucao. Nao ha inconsistencia grave
ainda - justamente por isso e o momento de fixar o vocabulario, antes de RF11,
RF16 e RF17 multiplicarem o texto.

Ha tambem uma restricao tecnica registrada em `CLAUDE.md`: textos de interface em
portugues, sem acentuacao nos arquivos de codigo, para evitar problema de
encoding no Windows.

## Objetivo

Definir o vocabulario da plataforma e alinhar todos os textos existentes a ele.

## Escopo tecnico

- `docs/GLOSSARIO.md` (novo)
- `apps/web/src/features/workspace/*.tsx`
- `apps/web/src/components/theme-toggle.tsx`
- `packages/shared/src/schemas/*.ts` - mensagens de validacao
- `apps/api/src/modules/**/routes.ts` - mensagens de erro

## Passo a passo

1. Levantar todo texto visivel ao usuario: rotulos, titulos, estados vazios,
   mensagens de erro da API, mensagens de validacao Zod e textos de toast.
2. Escrever o glossario com uma entrada por conceito: termo adotado, definicao em
   uma frase, e os termos rejeitados. Cobrir no minimo: design, testbench, modulo
   de topo, compilar, simular, forma de onda, diagnostico, projeto, executar.
3. Decidir cada termo com um criterio explicito: preferir a palavra que o aluno
   ja viu na disciplina; quando o termo tecnico for inevitavel, usa-lo e explica-lo
   na primeira ocorrencia (com link para RF11).
4. Alinhar os textos existentes ao glossario, incluindo as mensagens vindas da
   API - o usuario nao distingue origem.
5. Revisar as mensagens de erro contra o criterio "diz o que houve e qual o
   proximo passo". "Falha ao executar a simulacao" descreve; nao orienta.
6. Padronizar o tom: segunda pessoa, frases curtas, sem exclamacao, sem
   culpabilizar o usuario.
7. Conferir a regra de acentuacao de `CLAUDE.md` em todos os arquivos alterados.
8. Registrar no `CLAUDE.md` que textos novos devem consultar o glossario.

## Criterios de aceite

- [ ] `docs/GLOSSARIO.md` existe, com definicao e alternativas rejeitadas.
- [ ] Todo texto de interface usa os termos do glossario.
- [ ] As mensagens de erro da API seguem o mesmo vocabulario.
- [ ] Nenhuma mensagem de erro apenas descreve sem orientar.
- [ ] O tom e consistente em toda a interface.
- [ ] A regra de acentuacao de `CLAUDE.md` e respeitada.
- [ ] `CLAUDE.md` aponta para o glossario.

## Verificacao

```bash
pnpm typecheck
pnpm format:check
pnpm --filter @tplab/web build
```

Manual: percorrer todas as telas lendo cada texto contra o glossario.

## Riscos

- Glossario que nao e consultado envelhece rapido; o apontamento em `CLAUDE.md` e
  o que o mantem vivo no fluxo de trabalho.
- Traduzir termo tecnico consagrado ("testbench") pode confundir mais que ajudar
  - manter o termo em ingles e explica-lo e uma escolha legitima, e precisa
  aparecer no glossario como decisao.

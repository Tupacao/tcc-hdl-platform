# RNF09-I01 - Auditoria de contraste dos tokens de tema

| Campo | Valor |
| --- | --- |
| Feature | [RNF09](feature.md) |
| Branch | `chore/rnf09-auditoria-tokens-de-tema` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | - |

## Contexto

O comentario em `apps/web/src/index.css` afirma que os pares fundo/texto seguem o
preset slate do shadcn/ui, "cujo contraste atende o nivel AA". A afirmacao e
plausivel e nunca foi verificada neste projeto - e ha dois motivos concretos para
duvidar dela como garantia geral:

1. **Tokens acrescentados fora do preset.** `--success` e `--warning` foram
   definidos com valores proprios nos dois temas, sem herdar verificacao nenhuma.
   `--warning` ja e usado em `console-panel.tsx` como `text-warning`.
2. **Tokens com opacidade.** No tema escuro, `--border` e `--input` sao
   `oklch(1 0 0 / 12%)` e `/ 18%` - branco translucido. O contraste efetivo
   depende do fundo por tras, e 12% de branco sobre um fundo escuro dificilmente
   alcanca os 3:1 exigidos para contraste de elementos.

Um preset atender AA nos pares que ele mesmo prescreve nao garante AA em como o
projeto combina os tokens.

## Objetivo

Verificar todos os pares de token efetivamente usados, nos dois temas, e corrigir
os que reprovarem.

## Escopo tecnico

- `apps/web/src/index.css` - valores de token
- `apps/web/src/features/**/*.tsx` - usos
- `docs/ACESSIBILIDADE.md` (novo) - tabela de resultados
- `.claude/skills/a11y-audit/` - ferramenta ja disponivel no repositorio

## Passo a passo

1. Levantar os pares realmente usados, e nao todas as combinacoes possiveis:
   percorrer os componentes anotando qual cor de texto aparece sobre qual fundo.
   O conjunto real e bem menor que o produto cartesiano.
2. Calcular a razao de contraste de cada par nos dois temas. Os valores estao em
   `oklch` e precisam ser convertidos para sRGB antes do calculo - a formula do
   WCAG opera sobre luminancia relativa em sRGB.
3. Tratar os tokens com opacidade compondo a cor sobre o fundo real antes de
   calcular: `--border` no escuro precisa ser avaliado como o resultado da
   composicao, nao como branco.
4. Verificar as tres categorias separadamente:
   - texto normal (4,5:1);
   - texto grande (3:1) - conferir se algum texto realmente se qualifica pelo
     tamanho, em vez de assumir;
   - elementos nao textuais (3:1): bordas de campo, icones informativos e o anel
     de foco (`--ring`) sobre cada fundo.
5. Prestar atencao aos pares suspeitos ja identificados:
   `--muted-foreground` sobre `--muted`, `--warning` sobre `--background`,
   `--destructive` sobre `--card`, `--border` e `--input` no escuro.
6. Corrigir os reprovados ajustando o valor do token conforme a tabela do design
   de RNF09 - nunca com correcao pontual em um componente, que faria a paleta
   divergir.
7. Verificar tambem o `sonner`, que renderiza toasts com estilo proprio e pode
   nao usar os tokens do projeto.
8. Registrar a tabela completa em `docs/ACESSIBILIDADE.md`: par, tema, razao,
   limiar aplicavel e resultado.
9. Deixar a verificacao repetivel: um script simples que leia os tokens de
   `index.css` e recalcule as razoes, para detectar regressao quando alguem
   ajustar uma cor.

## Criterios de aceite

- [ ] Todos os pares em uso estao listados e verificados nos dois temas.
- [ ] Nenhum par de texto fica abaixo de 4,5:1 (ou 3:1, se texto grande).
- [ ] Bordas, icones e anel de foco atingem 3:1.
- [ ] Tokens com opacidade foram avaliados por composicao.
- [ ] `--success` e `--warning` estao verificados nos dois temas.
- [ ] Os toasts do `sonner` foram verificados.
- [ ] As correcoes foram feitas nos tokens, nao em componentes isolados.
- [ ] `docs/ACESSIBILIDADE.md` traz a tabela completa.
- [ ] Ha verificacao repetivel contra regressao.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

O verificador de contraste da skill `a11y-audit` esta em
`.claude/skills/a11y-audit/scripts/contrast_checker.py` e exige Python instalado
(ver `CLAUDE.md`); sem Python, implementar o calculo no script do proprio
projeto, que tambem serve a verificacao repetivel.

## Riscos

- Converter `oklch` para sRGB de forma aproximada produz razao errada e
  aprovacao falsa; usar conversao correta ou ler a cor computada do navegador.
- Ajustar um token para passar em um par pode reprovar outro; a tabela completa
  precisa ser recalculada apos cada ajuste, nao apenas a linha corrigida.
- Confiar na afirmacao do preset e o que criou a lacuna; o entregavel desta issue
  e a medicao, nao a confirmacao da hipotese.

# RNF09-I01 - Auditoria de contraste dos tokens de tema

| Campo | Valor |
| --- | --- |
| Feature | [RNF09](feature.md) |
| Branch | `feat-RNF09-auditoria-contraste-front` |
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

- [x] Todos os pares em uso estao listados e verificados nos dois temas.
      _(46 pares, `apps/web/scripts/check-contrast.mjs`)_
- [x] Nenhum par de texto fica abaixo de 4,5:1 (ou 3:1, se texto grande).
      _(quatro reprovações reais corrigidas — ver `docs/ACESSIBILIDADE.md`)_
- [x] Bordas, icones e anel de foco atingem 3:1 — ou tem exceção justificada
      registrada (`--border` como divisor decorativo, `outline-ring/50` como
      reset de base por trás do anel de foco real).
- [x] Tokens com opacidade foram avaliados por composicao.
      _(`composite()` no script, sobre o fundo real declarado por par)_
- [x] `--success` e `--warning` estao verificados nos dois temas.
- [x] Os toasts do `sonner` foram verificados. _(achado real: tema sempre
      claro, não os tokens do projeto — corrigido, ver Nota)_
- [x] As correcoes foram feitas nos tokens, nao em componentes isolados.
      _(`--editor-line-number` no token; as opacidades de badge — ver Nota —
      não são cor nova, só quanto do token já existente se mistura ao fundo)_
- [x] `docs/ACESSIBILIDADE.md` traz a tabela completa.
- [x] Ha verificacao repetivel contra regressao.
      _(`pnpm --filter @tplab/web audit:contrast`, sai com código 1 se algo
      reprovar sem exceção registrada)_

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
pnpm --filter @tplab/web audit:contrast
```

O verificador de contraste da skill `a11y-audit` esta em
`.claude/skills/a11y-audit/scripts/contrast_checker.py` e exige Python instalado
(ver `CLAUDE.md`); sem Python, implementar o calculo no script do proprio
projeto, que tambem serve a verificacao repetivel.

## Nota de implementacao

A premissa da issue (paleta `oklch` herdada do preset slate do shadcn/ui) já
não valia mais no momento da execução: `apps/web/src/index.css` migrou para a
paleta laranja/preto/branco de `docs/design-system-fundamentos.md` (RF11),
inteiramente em hex, sem opacidade nos tokens base — só em usos pontuais via
modificador Tailwind (`bg-warning/10` etc.), que é exatamente o caso que o
risco #1 desta issue antecipava (conversão de cor composta). O script
(`apps/web/scripts/check-contrast.mjs`) não depende de Python nem lê cor
computada do navegador — lê os hex direto de `index.css` e calcula a
composição alfa manualmente, o que é exato (não aproximado) para cores sólidas
sobre fundo sólido, que é o único caso real no projeto (sem gradientes ou
imagens atrás de texto).

Quatro reprovações reais apareceram (não visíveis a olho nu, só ao medir) —
detalhes e correção de cada uma em `docs/ACESSIBILIDADE.md`: `muted-foreground/70`
(texto genuíno de posição de diagnóstico, não decorativo — opacidade
removida), os badges `bg-destructive/15`/`bg-warning/15`/`bg-success/10`
(contra-intuitivo: **baixar** a opacidade do tint aumenta o contraste do texto
colorido sobre ele, não o contrário — verificado por tentativa sistemática de
valores via o script), e `--editor-line-number` (RF02-I02), reclassificado
como texto (não elemento decorativo) e ajustado nos dois temas.

Achado fora do escopo original mas do mesmo tipo de defeito (paleta que não
segue o tema do produto): o `<Toaster />` do `sonner` em `App.tsx` não tinha
`theme` explícito, e o default da biblioteca é `'light'` fixo — não reage a
`prefers-color-scheme` nem à classe `.dark` da aplicação. Verificado ao vivo
clicando "Copiar" num bloco de código da documentação em tema escuro: o toast
aparecia sempre com fundo claro. Corrigido com um componente `<ThemedToaster />`
(`apps/web/src/components/themed-toaster.tsx`) que lê `resolvedTheme` de
`useTheme()` — precisa estar dentro de `<ThemeProvider>` para isso, por isso
não é só um prop a mais em `App.tsx`.

## Riscos

- Converter `oklch` para sRGB de forma aproximada produz razao errada e
  aprovacao falsa; usar conversao correta ou ler a cor computada do navegador.
  _(não se aplicou — paleta já é hex, ver Nota)_
- Ajustar um token para passar em um par pode reprovar outro; a tabela completa
  precisa ser recalculada apos cada ajuste, nao apenas a linha corrigida.
  _(o script recalcula os 46 pares inteiros a cada execução, não por linha)_
- Confiar na afirmacao do preset e o que criou a lacuna; o entregavel desta issue
  e a medicao, nao a confirmacao da hipotese. _(medição real feita; quatro
  reprovações confirmam que a lacuna era real, mesmo com a paleta já revisada
  por RF11)_

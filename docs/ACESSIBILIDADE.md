# Acessibilidade — auditoria de contraste (RNF09)

> Este documento registra a verificação exigida por RNF09 (contraste WCAG 2.2
> nível AA, nos dois temas) e pelo critério 1.4.1 (a cor não pode ser o único
> canal de informação). Cobre as duas issues da feature:
> [RNF09-I01](requisitos/nao-funcional/RNF09/issue-01-auditoria-tokens-de-tema.md)
> (tokens de tema) e
> [RNF09-I02](requisitos/nao-funcional/RNF09/issue-02-contraste-editor-e-ondas.md)
> (editor Monaco e visualizador de formas de onda).

## Como reproduzir

```bash
pnpm --filter @tplab/web audit:contrast
```

`apps/web/scripts/check-contrast.mjs` lê os tokens direto de
`apps/web/src/index.css` (nunca duplica os valores aqui) e recalcula a razão
de contraste WCAG de cada par listado abaixo, nos dois temas. Sai com código
`1` se algum par reprovar sem justificativa registrada — serve como
verificação de regressão: rodar de novo depois de qualquer ajuste de cor.

Não depende de Python (ao contrário de
`.claude/skills/a11y-audit/scripts/contrast_checker.py`, que exige Python
instalado — indisponível neste ambiente, ver `CLAUDE.md`).

## Metodologia

- Razão de contraste calculada pela fórmula do WCAG 2.2 (luminância relativa
  em sRGB linearizado), sobre os valores hexadecimais de
  `docs/design-system-fundamentos.md` seção 7 (paleta) e seção 8 (sintaxe/
  editor) — a mesma fonte que `apps/web/src/index.css` usa.
- Tokens com opacidade (`bg-warning/10` etc.) são **compostos** sobre o fundo
  real antes do cálculo (`resultado = cor × alfa + fundo × (1 − alfa)`), não
  avaliados como a cor pura — um erro comum que produziria aprovação falsa.
- Pares levantados a partir do uso real no código (`grep` por `text-*`/
  `bg-*`/`border-*` dos tokens de tema em `apps/web/src`), não do produto
  cartesiano de todas as combinações possíveis.
- Limiares: 4,5:1 para texto normal, 3:1 para texto grande (nenhum uso atual
  se qualifica por tamanho) e 3:1 para elementos não textuais (bordas de
  controle, ícones informativos, anel de foco).

## Resultado

Todos os pares levantados passam no limiar aplicável, ou têm uma exceção
justificada (marcada `EXEMPT` na saída do script) — nenhum par reprova sem
justificativa. Rodar `pnpm --filter @tplab/web audit:contrast` reproduz a
tabela completa, tema a tema, com o par exato de cores usado em cada cálculo.

### Correções feitas (RNF09-I01)

Quatro problemas reais apareceram na primeira rodada da auditoria — nenhum
deles visível "a olho nu", só ao medir:

| Par | Onde | Antes | Depois | Motivo |
| --- | --- | --- | --- | --- |
| `muted-foreground/70` sobre fundo | `problems-list.tsx` (posição do diagnóstico quando a linha não é navegável) | 3,48:1 claro / 4,20:1 escuro | 4,5:1+ nos dois (removida a opacidade `/70`) | A opacidade reduzia contraste de texto real (não decorativo); a linha já se distingue de "navegável" pela ausência do botão "Ir para a linha", sem precisar apagar o texto |
| `destructive`/`warning` sobre `bg-*/15` | `console-panel.tsx` (contador da aba Problemas) | 4,46:1 / 4,40:1 no claro (< 4,5:1) | `/10` — 4,89:1 / 4,74:1 | Tint mais escuro que o esperado: aumentar a opacidade da mistura *reduz* o contraste do texto colorido sobre ela (o fundo se aproxima da cor do texto); baixar a opacidade foi a correção certa, não subir |
| `success` sobre `bg-success/10` | `problems-list.tsx` ("0 erros · a simulação rodou normalmente") | 4,38:1 no claro | `/5` — 4,70:1 | Mesmo efeito do item acima |
| `success/40` (borda do card acima) | idem | 1,78:1 / 2,46:1 (elemento, < 3:1) | opacidade total — 5,02:1 / 10,22:1 | A informação já está redundante no texto "0 erros", então a borda é decorativa (não exigiria correção por si só) — mas ficou de graça trocar para opacidade total, sem ambiguidade |
| `--editor-line-number` | tema Monaco (RF02-I02) | 3,55:1 claro / 2,81:1 escuro (< 4,5:1) | `#6e6e75` / `#80809a` — 4,85:1 / 4,98:1 | Número de linha é texto (dígitos que o usuário lê para localizar erro/aviso), não decoração — segue o limiar de 4,5:1, não o de elemento não textual. VS Code usa contraste mais baixo aqui (convenção familiar, ver risco de RF02-I02), mas RNF01 (usuários iniciantes) pesa a favor de legibilidade |
| toast do `sonner` sempre claro | `App.tsx` | tema fixo `light` (prop default do `sonner`, não reage a `.dark`) | `<ThemedToaster />` (`apps/web/src/components/themed-toaster.tsx`) passa `theme={resolvedTheme}` | Não é bem uma reprovação de *contraste* — o toast claro sobre claro/escuro sobre escuro internamente tem contraste correto — mas renderizava sempre com a paleta clara do `sonner`, inclusive por cima da interface escura (achado ao vivo durante esta auditoria, não estava no escopo original de RNF09-I01, mas é o mesmo defeito de raiz: paleta que não segue o tema do produto) |

### Exceções registradas (não corrigidas, com motivo)

| Par | Razão medida | Por que não é uma reprovação |
| --- | --- | --- |
| `--border` sobre `--background` | 1,29:1 / 1,40:1 | Usado como separador decorativo de painel/seção (`border-b`, `border-t`), não como contorno de componente interativo — campos de formulário usam `--input`, que passa (3,70:1 / 3,77:1). WCAG 1.4.11 não exige contraste de elementos puramente decorativos |
| `outline-ring/50` (regra global em `*`) | 2,19:1 / 2,84:1 | É um reset de base, não o indicador de foco ativo: todo elemento interativo auditado neste projeto (botões, inputs, abas, controles do visualizador) declara `focus-visible:ring-2 focus-visible:ring-ring` em opacidade total por cima dele, e esse par passa (5,18:1 / 8,38:1) |
| `--wave-grid` sobre `--background` | 1,15:1 / 1,25:1 | Grade de referência puramente visual; o valor/tempo real vem do traço do sinal e da tabela "Leitura no cursor" (RF06), não da grade. Grade forte demais competiria com os traços, que são a informação primária — convenção padrão em visualizadores de forma de onda (GTKWave, ModelSim, etc.) |

### Toasts (`sonner`)

`sonner` tem paleta própria (não lê `--popover`/`--popover-foreground` do
projeto) e o prop `theme` tem default fixo `'light'` — sem passá-lo
explicitamente, o toast renderizava sempre claro, inclusive por cima da
interface escura. Achado ao vivo ao testar o botão "Copiar" dos blocos de
código da documentação em tema escuro (imagem confirmada antes/depois via
chrome-devtools MCP). Corrigido com `<ThemedToaster />`
(`apps/web/src/components/themed-toaster.tsx`), que lê `resolvedTheme` de
`useTheme()` e repassa para o `<Toaster theme={...}>` — a paleta interna do
`sonner` (`--normal-bg`/`--normal-text` etc., não os tokens do projeto) já
tem contraste adequado em ambos os modos por padrão da biblioteca; o problema
era só qual modo estava ativo, não o contraste dentro de cada modo.

## RNF09-I02 — editor Monaco e formas de onda

### Editor

Tema Monaco customizado (`apps/web/src/lib/monaco-theme.ts`, RF02-I02) deriva
todas as cores de sintaxe dos mesmos tokens `--code-*`/`--editor-*` da tabela
acima — não há paleta duplicada para o editor. Os oito tokens de sintaxe
(`code-foreground`, `code-keyword`, `code-type`, `code-directive`,
`code-number`, `code-string`, `code-comment`, `code-operator`) e o número de
linha passam em 4,5:1 nos dois temas contra `--editor-background` (ver tabela
completa via `audit:contrast`).

Sublinhado de erro e símbolo de margem (RF05) usam as cores padrão do Monaco
(`editorError.foreground` / `editorWarning.foreground`), não customizadas
nesta issue — o fundo de linha com erro (`--editor-error-line`, RF02-I02) é um
reforço visual adicional, não o único canal (o sublinhado ondulado + o ícone
na lista de Problemas + o texto da mensagem já formam três canais
independentes).

### Formas de onda (RF06)

Cores medidas contra o fundo do canvas (transparente, herda `--background`
via composição — não há `ctx.fillStyle` de fundo em `render.ts`, só
`clearRect`): `wave-level`, `wave-bus`, `wave-x`, `wave-cursor`,
`wave-ruler-foreground` passam confortavelmente em 3:1 (não textual) ou 4,5:1
(régua, que é texto) nos dois temas; `wave-z` também passa. `wave-grid` é a
exceção documentada acima (decorativa).

**Canais redundantes já implementados** (verificado lendo
`apps/web/src/features/waveform/utils/render.ts`, sem necessidade de mudança
nesta issue):

- **Alta impedância (`z`)**: traço tracejado (`ctx.setLineDash([4, 3])`), não
  só uma cor diferente.
- **Valor indefinido (`x`)**: hachura no preenchimento do barramento e o texto
  do valor renderiza com `colors.foreground` (cor de texto padrão do tema, de
  alto contraste) em vez de `colors.waveBus` — legível mesmo se `wave-x` não
  puder ser distinguido de `wave-bus` por cor.

## Critério 1.4.1 (cor não é o único canal) fora do canvas

Verificado lendo o código (não depende de auditoria automática):

- **Diagnósticos (RF05)**: `problems-list.tsx` usa `CircleX` (erro) e
  `TriangleAlert` (aviso) — ícones de formato distinto, não só cor — e o rótulo
  de severidade também aparece como texto ("Erro de sintaxe" etc.).
- **Aba com erro / não salva (RF09-I03)**: `file-tabs.tsx` usa `CircleX`
  (ícone com X, erro) versus `●` (indicador de alteração não salva) — formas
  diferentes — e ambos têm texto `sr-only` equivalente para leitor de tela.
- **Estados de execução (RF04-I03)**: `status-bar.tsx` combina cor com o
  rótulo textual do estado ("Executado sem erros", "Falhou na compilação"
  etc.), nunca só a cor.

## Simulação de daltonismo

Verificado ao vivo (chrome-devtools MCP) aplicando um filtro SVG de
deuteranopia (`feColorMatrix`) sobre `<html>` com uma simulação já executada
na tela: o badge "0 erros" continua legível (texto e borda), a régua e os
traços do visualizador continuam distinguíveis do fundo. Não foi reproduzido
um erro real de compilação sob o filtro nesta sessão para checar
`text-destructive` vs. `text-warning` lado a lado — mas como RF05 e RF09-I03
já usam formato de ícone (não só cor) para essa distinção (ver seção
anterior), a checagem estrutural do código é suficiente: a distinção
sobrevive independente de qualquer simulação de matiz, porque não depende de
matiz. Protanopia e tritanopia não foram simuladas ao vivo nesta sessão pelo
mesmo motivo — a redundância de forma/texto já verificada cobre os três
tipos.

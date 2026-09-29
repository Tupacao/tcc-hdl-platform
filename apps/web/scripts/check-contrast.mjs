#!/usr/bin/env node
/**
 * RNF09-I01 — recalcula a razão de contraste WCAG de todos os pares de token
 * realmente usados na interface, lendo os valores direto de `src/index.css`
 * (nunca hardcoded aqui, para não divergir da fonte da verdade). Roda em
 * qualquer ambiente com Node — não depende de Python (ver `contrast_checker.py`
 * da skill `a11y-audit`, que exige Python instalado, indisponível neste projeto).
 *
 * Uso: node scripts/check-contrast.mjs
 * Sai com código 1 se algum par reprovar — serve como verificação de regressão.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(__dirname, '..', 'src', 'index.css');

// --- Leitura dos tokens -----------------------------------------------------

function parseTokenBlock(css, selector) {
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  if (!match) throw new Error(`Bloco "${selector}" não encontrado em index.css`);
  const tokens = {};
  for (const line of match[1].split(';')) {
    const m = line.match(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})/);
    if (m) tokens[m[1]] = m[2];
  }
  return tokens;
}

const css = readFileSync(CSS_PATH, 'utf8');
const light = parseTokenBlock(css, ':root');
const dark = parseTokenBlock(css, '\\.dark');

// --- Matemática WCAG ---------------------------------------------------------

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function relativeLuminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [rl, gl, bl] = [lin(r), lin(g), lin(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexToRgb(hexA));
  const lb = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Composição alfa: `fgHex` a `alphaPercent`% sobre `bgHex` opaco. */
function composite(fgHex, alphaPercent, bgHex) {
  const a = alphaPercent / 100;
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const mixed = fg.map((c, i) => c * a + bg[i] * (1 - a));
  return rgbToHex(mixed);
}

// --- Pares em uso -------------------------------------------------------------
// Levantados em `apps/web/src` (grep por `text-*`/`bg-*` dos tokens de tema).
// `kind`: 'text' (4.5:1), 'large' (3:1, texto >=18.66px negrito ou 24px) ou
// 'nontext' (3:1 — bordas, ícones informativos, anel de foco).

const PAIRS = [
  // Texto padrão sobre cada superfície
  { name: 'foreground / background', fg: 'foreground', bg: 'background', kind: 'text' },
  { name: 'foreground / card', fg: 'foreground', bg: 'card', kind: 'text' },
  { name: 'card-foreground / card', fg: 'card-foreground', bg: 'card', kind: 'text' },
  { name: 'popover-foreground / popover', fg: 'popover-foreground', bg: 'popover', kind: 'text' },
  {
    name: 'secondary-foreground / secondary',
    fg: 'secondary-foreground',
    bg: 'secondary',
    kind: 'text',
  },
  { name: 'accent-foreground / accent', fg: 'accent-foreground', bg: 'accent', kind: 'text' },
  { name: 'muted-foreground / background', fg: 'muted-foreground', bg: 'background', kind: 'text' },
  { name: 'muted-foreground / card', fg: 'muted-foreground', bg: 'card', kind: 'text' },
  { name: 'muted-foreground / muted', fg: 'muted-foreground', bg: 'muted', kind: 'text' },
  {
    name: 'primary-foreground / primary (botão "Executar")',
    fg: 'primary-foreground',
    bg: 'primary',
    kind: 'text',
  },
  {
    name: 'destructive-foreground / destructive (botão)',
    fg: 'destructive-foreground',
    bg: 'destructive',
    kind: 'text',
  },
  { name: 'destructive / background', fg: 'destructive', bg: 'background', kind: 'text' },
  { name: 'destructive / card', fg: 'destructive', bg: 'card', kind: 'text' },
  {
    name: 'destructive / bg-destructive/10 (console-panel badge)',
    fg: 'destructive',
    bg: 'destructive',
    bgAlpha: 10,
    bgOnto: 'background',
    kind: 'text',
  },
  { name: 'warning / background', fg: 'warning', bg: 'background', kind: 'text' },
  { name: 'warning / card', fg: 'warning', bg: 'card', kind: 'text' },
  {
    name: 'warning / bg-warning/10 (aviso de truncamento, console-panel badge)',
    fg: 'warning',
    bg: 'warning',
    bgAlpha: 10,
    bgOnto: 'background',
    kind: 'text',
  },
  { name: 'success / background', fg: 'success', bg: 'background', kind: 'text' },
  { name: 'success / card', fg: 'success', bg: 'card', kind: 'text' },
  {
    name: 'success / bg-success/5 (problems-list "0 erros")',
    fg: 'success',
    bg: 'success',
    bgAlpha: 5,
    bgOnto: 'background',
    kind: 'text',
  },
  {
    name: 'success / background (borda do card "0 erros", agora opacidade total)',
    fg: 'success',
    bg: 'background',
    kind: 'nontext',
  },
  { name: 'primary-strong / background', fg: 'primary-strong', bg: 'background', kind: 'text' },
  { name: 'primary-strong / card', fg: 'primary-strong', bg: 'card', kind: 'text' },
  {
    name: 'primary-strong / bg-primary/10 (o-que-nao-faz badge)',
    fg: 'primary-strong',
    bg: 'primary',
    bgAlpha: 10,
    bgOnto: 'background',
    kind: 'text',
  },
  {
    name: 'primary-strong / bg-primary/15 (file-tabs aba ativa)',
    fg: 'primary-strong',
    bg: 'primary',
    bgAlpha: 15,
    bgOnto: 'background',
    kind: 'text',
  },
  // Não-texto (3:1): bordas, ícones informativos, anel de foco
  {
    name: 'border / background (divisor decorativo, não contorno de componente)',
    fg: 'border',
    bg: 'background',
    kind: 'nontext',
    exempt:
      'usado como separador de painel/seção (border-b/border-t), não como contorno de componente interativo — campos de formulário usam --input (verificado abaixo, passa). WCAG 1.4.11 não exige contraste de elementos puramente decorativos.',
  },
  {
    name: 'input / background (contraste de elemento)',
    fg: 'input',
    bg: 'background',
    kind: 'nontext',
  },
  {
    name: 'ring / background (anel de foco, opacidade total)',
    fg: 'ring',
    bg: 'background',
    kind: 'nontext',
  },
  {
    name: 'ring/50 / background (outline padrão global, `outline-ring/50` em `*`)',
    fg: 'ring',
    fgAlpha: 50,
    bg: 'background',
    kind: 'nontext',
    exempt:
      'reset de base, não o indicador de foco ativo: todo elemento interativo auditado neste projeto declara `focus-visible:ring-2 focus-visible:ring-ring` (opacidade total, verificado acima) por cima deste outline.',
  },
  // Editor Monaco (RF02-I02/RNF09-I02) — fundo próprio, não `--background`
  {
    name: 'code-foreground / editor-background',
    fg: 'code-foreground',
    bg: 'editor-background',
    kind: 'text',
  },
  {
    name: 'code-keyword / editor-background',
    fg: 'code-keyword',
    bg: 'editor-background',
    kind: 'text',
  },
  { name: 'code-type / editor-background', fg: 'code-type', bg: 'editor-background', kind: 'text' },
  {
    name: 'code-directive / editor-background',
    fg: 'code-directive',
    bg: 'editor-background',
    kind: 'text',
  },
  {
    name: 'code-number / editor-background',
    fg: 'code-number',
    bg: 'editor-background',
    kind: 'text',
  },
  {
    name: 'code-string / editor-background',
    fg: 'code-string',
    bg: 'editor-background',
    kind: 'text',
  },
  {
    name: 'code-comment / editor-background',
    fg: 'code-comment',
    bg: 'editor-background',
    kind: 'text',
  },
  {
    name: 'code-operator / editor-background',
    fg: 'code-operator',
    bg: 'editor-background',
    kind: 'text',
  },
  {
    name: 'editor-line-number / editor-background (número de linha é texto, não decoração)',
    fg: 'editor-line-number',
    bg: 'editor-background',
    kind: 'text',
  },
  // Formas de onda (RF06/RNF09-I02) — canvas transparente sobre `--background`
  {
    name: 'wave-level / background (traço de sinal)',
    fg: 'wave-level',
    bg: 'background',
    kind: 'nontext',
  },
  {
    name: 'wave-bus / background (traço de barramento)',
    fg: 'wave-bus',
    bg: 'background',
    kind: 'nontext',
  },
  { name: 'wave-x / background', fg: 'wave-x', bg: 'background', kind: 'nontext' },
  { name: 'wave-z / background', fg: 'wave-z', bg: 'background', kind: 'nontext' },
  {
    name: 'wave-grid / background (grade de referência, decorativa)',
    fg: 'wave-grid',
    bg: 'background',
    kind: 'nontext',
    exempt:
      'grade de fundo só ajuda a alinhar visualmente transições no tempo; o valor/tempo em si vem do traço do sinal e da tabela "Leitura no cursor" (redundância já exigida pelo critério 1.4.1). Grade forte demais compete visualmente com os traços, que são a informação primária — convenção comum em visualizadores de forma de onda (GTKWave, ModelSim).',
  },
  { name: 'wave-cursor / background', fg: 'wave-cursor', bg: 'background', kind: 'nontext' },
  {
    name: 'wave-ruler-foreground / background (texto da régua)',
    fg: 'wave-ruler-foreground',
    bg: 'background',
    kind: 'text',
  },
];

const THRESHOLDS = { text: 4.5, large: 3, nontext: 3 };

function resolve(tokens, name, alpha, onto) {
  const base = tokens[name];
  if (!base) throw new Error(`Token --${name} não encontrado`);
  if (alpha === undefined) return base;
  const ontoHex = tokens[onto ?? 'background'];
  return composite(base, alpha, ontoHex);
}

function run(themeName, tokens) {
  console.log(`\n=== Tema ${themeName} ===`);
  let failures = 0;
  for (const pair of PAIRS) {
    const fgHex = resolve(tokens, pair.fg, pair.fgAlpha);
    const bgHex = resolve(tokens, pair.bg, pair.bgAlpha, pair.bgOnto);
    const ratio = contrastRatio(fgHex, bgHex);
    const threshold = THRESHOLDS[pair.kind];
    const pass = ratio >= threshold;
    const ratioStr = ratio.toFixed(2).padStart(5);
    let status;
    if (pass) status = 'PASS';
    else if (pair.exempt) status = 'EXEMPT';
    else {
      status = 'FAIL';
      failures++;
    }
    console.log(
      `${status.padEnd(6)}  ${ratioStr}:1 (mín. ${threshold}:1)  ${pair.name}  [${fgHex} / ${bgHex}]`,
    );
    if (status === 'EXEMPT') console.log(`        -> ${pair.exempt}`);
  }
  return failures;
}

const failuresLight = run('claro', light);
const failuresDark = run('escuro', dark);

const total = failuresLight + failuresDark;
console.log(
  `\n${total === 0 ? 'Todos os pares passaram (ou têm exceção justificada).' : `${total} par(es) reprovado(s) sem justificativa.`}`,
);
process.exit(total === 0 ? 0 : 1);

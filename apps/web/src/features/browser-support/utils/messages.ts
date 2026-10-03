/** Textos do Figma 10.4 (RNF02) — a faixa nunca bloqueia o uso (RF01). */
export const BANNER_TEXT =
  'Este navegador pode não exibir tudo corretamente. Testado em Chrome, Firefox, Edge e Safari recentes.';
export const SEE_BROWSERS_LABEL = 'Ver navegadores testados';
export const DISMISS_LABEL = 'Fechar aviso de navegador';
export const BANNER_REGION_LABEL = 'Aviso de compatibilidade do navegador';

export const BROWSERS_DIALOG = {
  title: 'Navegadores testados',
  description:
    'A plataforma é testada nestas versões ou mais recentes. Em outro navegador ela pode funcionar, mas sem garantia.',
  missingPrefix: 'Recursos ausentes neste navegador:',
} as const;

/** Piso de compatibilidade (decisão de 2026-10-03). Mudar exige mudar `build.target` e o README. */
export const TESTED_BROWSERS = [
  { name: 'Chrome', minVersion: 120 },
  { name: 'Firefox', minVersion: 121 },
  { name: 'Edge', minVersion: 120 },
  { name: 'Safari', minVersion: 17 },
] as const;

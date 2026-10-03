/**
 * RNF02-I01 — detecção por CAPACIDADE (nunca por user agent, que quebra a cada mudança de
 * string) das APIs que a aplicação realmente usa: Web Worker (parser de VCD), `matchMedia`
 * (tema), `ResizeObserver` (painéis/forma de onda), canvas 2D (forma de onda) e
 * `structuredClone`. Navegadores que passam em todas costumam ser os da lista
 * `TESTED_BROWSERS` (README, "Compatibilidade").
 */
export type Capability =
  'worker' | 'matchMedia' | 'resizeObserver' | 'canvas2d' | 'structuredClone';

/** Superfície mínima de `globalThis` consultada — permite testar sem navegador. */
export interface CapabilityEnv {
  Worker?: unknown;
  matchMedia?: unknown;
  ResizeObserver?: unknown;
  structuredClone?: unknown;
  /** `true` quando um canvas 2D pode ser criado. */
  canvas2d: boolean;
}

export const CAPABILITY_LABELS: Record<Capability, string> = {
  worker: 'Web Workers',
  matchMedia: 'matchMedia',
  resizeObserver: 'ResizeObserver',
  canvas2d: 'Canvas 2D',
  structuredClone: 'structuredClone',
};

/** Capacidades ausentes em `env`; lista vazia = navegador adequado. */
export function findMissingCapabilities(env: CapabilityEnv): Capability[] {
  const present: Record<Capability, boolean> = {
    worker: typeof env.Worker === 'function',
    matchMedia: typeof env.matchMedia === 'function',
    resizeObserver: typeof env.ResizeObserver === 'function',
    canvas2d: env.canvas2d,
    structuredClone: typeof env.structuredClone === 'function',
  };
  return (Object.keys(present) as Capability[]).filter((capability) => !present[capability]);
}

function canCreateCanvas2d(): boolean {
  try {
    return document.createElement('canvas').getContext('2d') !== null;
  } catch {
    return false;
  }
}

/** Mesma checagem, sobre o navegador real. Nunca lança. */
export function detectMissingCapabilities(): Capability[] {
  try {
    return findMissingCapabilities({
      Worker: globalThis.Worker,
      matchMedia: globalThis.matchMedia,
      ResizeObserver: globalThis.ResizeObserver,
      structuredClone: globalThis.structuredClone,
      canvas2d: canCreateCanvas2d(),
    });
  } catch {
    return [];
  }
}

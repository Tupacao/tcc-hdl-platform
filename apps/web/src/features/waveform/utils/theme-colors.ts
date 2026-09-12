import type { WaveformColors } from '../models/types';

function readVar(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim();
}

/**
 * Le os tokens dedicados de forma de onda (RF06, `docs/design-system-fundamentos.md`
 * secao 3) do elemento raiz. Chamar uma vez por mudanca de tema/tamanho e guardar o
 * resultado — repetir `getComputedStyle` a cada frame de desenho e caro.
 */
export function readWaveformColors(root: HTMLElement = document.documentElement): WaveformColors {
  const styles = getComputedStyle(root);
  return {
    waveLevel: readVar(styles, '--wave-level'),
    waveBus: readVar(styles, '--wave-bus'),
    waveX: readVar(styles, '--wave-x'),
    waveZ: readVar(styles, '--wave-z'),
    waveGrid: readVar(styles, '--wave-grid'),
    waveRulerForeground: readVar(styles, '--wave-ruler-foreground'),
    foreground: readVar(styles, '--foreground'),
  };
}

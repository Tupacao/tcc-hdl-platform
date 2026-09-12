import type { WaveformColors } from '../models/types';

function readVar(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim();
}

/**
 * Le os tokens de tema (RF10) do elemento raiz. Chamar uma vez por mudanca de
 * tema/tamanho e guardar o resultado — repetir `getComputedStyle` a cada frame
 * de desenho e caro.
 */
export function readWaveformColors(root: HTMLElement = document.documentElement): WaveformColors {
  const styles = getComputedStyle(root);
  return {
    foreground: readVar(styles, '--foreground'),
    mutedForeground: readVar(styles, '--muted-foreground'),
    border: readVar(styles, '--border'),
    destructive: readVar(styles, '--destructive'),
    warning: readVar(styles, '--warning'),
  };
}

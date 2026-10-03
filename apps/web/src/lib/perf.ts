/**
 * RNF07-I01 — marcas de tempo do ciclo "Executar → forma de onda desenhada", pela User Timing API.
 * Ficam visíveis na aba Performance do navegador e em
 * `performance.getEntriesByType('measure')`, sem dependência nem custo perceptível.
 *
 * Marcas (prefixo `tplab:`), em ordem: `run-start` (clique), `enqueued` (202 do POST),
 * `result` (desfecho no polling), `parse-start`/`vcd-parsed` (Web Worker) e `first-draw`
 * (primeiro quadro da forma de onda). Medidas derivadas: `enqueue`, `wait` (fila + execução +
 * polling), `parse`, `render` e `total` (clique → forma de onda). Método e números:
 * `docs/DESEMPENHO.md`.
 */
const PREFIX = 'tplab:';

const RUN_MARKS = ['run-start', 'enqueued', 'result', 'parse-start', 'vcd-parsed', 'first-draw'];
const RUN_MEASURES = ['enqueue', 'wait', 'parse', 'render', 'total'];

function safely(action: () => void): void {
  try {
    action();
  } catch {
    // Medir nunca pode quebrar a execução (ambiente sem User Timing, marca ausente).
  }
}

/** Nova execução: descarta as marcas e medidas da anterior. */
export function startRunPerf(): void {
  safely(() => {
    for (const name of RUN_MARKS) performance.clearMarks(PREFIX + name);
    for (const name of RUN_MEASURES) performance.clearMeasures(PREFIX + name);
    performance.mark(`${PREFIX}run-start`);
  });
}

export function markPerf(name: string): void {
  safely(() => performance.mark(PREFIX + name));
}

export function measurePerf(name: string, start: string, end: string): void {
  safely(() => performance.measure(PREFIX + name, PREFIX + start, PREFIX + end));
}

/**
 * Primeiro desenho da forma de onda desta execução: marca uma única vez (o canvas redesenha a
 * cada cursor/zoom) e fecha as medidas. Só conta depois de o parse desta execução terminar.
 */
export function finishRunPerf(): void {
  safely(() => {
    // Sem `vcd-parsed` o desenho é de uma forma de onda anterior (ex.: redimensionamento).
    if (performance.getEntriesByName(`${PREFIX}vcd-parsed`).length === 0) return;
    if (performance.getEntriesByName(`${PREFIX}first-draw`).length > 0) return;
    performance.mark(`${PREFIX}first-draw`);
    measurePerf('render', 'vcd-parsed', 'first-draw');
    measurePerf('total', 'run-start', 'first-draw');
  });
}

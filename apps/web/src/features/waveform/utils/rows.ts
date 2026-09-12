import type { WaveSignal } from '../models/types';

/**
 * Uma linha por id unico de VCD. Um mesmo net pode aparecer em mais de um
 * `WaveSignal` (ex.: uma porta do testbench e o wire correspondente dentro da
 * instancia) — como os dois compartilham a mesma serie de transicoes, exibir os
 * dois duplicaria a linha sem informacao nova. Mantem a primeira ocorrencia, que
 * normalmente e o escopo mais externo (o VCD do iverilog declara o escopo do
 * testbench antes de entrar nas instancias).
 */
export function selectDisplayRows(signals: WaveSignal[]): WaveSignal[] {
  const seen = new Set<string>();
  const rows: WaveSignal[] = [];
  for (const signal of signals) {
    if (seen.has(signal.id)) continue;
    seen.add(signal.id);
    rows.push(signal);
  }
  return rows;
}

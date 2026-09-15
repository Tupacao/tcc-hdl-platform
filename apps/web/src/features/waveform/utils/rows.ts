import type { WaveSignal } from '../models/types';

/**
 * Uma linha por id único de VCD. Um mesmo net pode aparecer em mais de um
 * `WaveSignal` (ex.: uma porta do testbench e o wire correspondente dentro da
 * instância) — como os dois compartilham a mesma série de transições, exibir os
 * dois duplicaria a linha sem informação nova. Mantém a primeira ocorrência, que
 * normalmente é o escopo mais externo (o VCD do iverilog declara o escopo do
 * testbench antes de entrar nas instâncias).
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

/**
 * Identidade estável de um sinal entre execuções (RF06-I03): o id do VCD não é
 * garantido estável de uma compilação para outra, mas o par escopo+nome é. É o
 * que decide se a seleção de sinais e o zoom sobrevivem a uma nova simulação.
 */
export function getSignalKey(signal: WaveSignal): string {
  return signal.scope ? `${signal.scope}.${signal.name}` : signal.name;
}

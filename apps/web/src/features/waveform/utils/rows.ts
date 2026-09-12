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

/**
 * Identidade estavel de um sinal entre execucoes (RF06-I03): o id do VCD nao e
 * garantido estavel de uma compilacao para outra, mas o par escopo+nome e. E o
 * que decide se a selecao de sinais e o zoom sobrevivem a uma nova simulacao.
 */
export function getSignalKey(signal: WaveSignal): string {
  return signal.scope ? `${signal.scope}.${signal.name}` : signal.name;
}

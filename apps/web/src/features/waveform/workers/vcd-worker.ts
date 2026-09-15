/// <reference lib="webworker" />
import { parseVcd } from '../utils/vcd-parser';

/**
 * RF06-I04 — parse fora da thread principal. Um `.vcd` próximo do teto de
 * RF04-I02 (8 MiB) tem centenas de milhares de transições; rodar `parseVcd`
 * (síncrono) na thread principal trava a interface por segundos enquanto
 * corre. `Waveform.transitions` é um `Map`, que o algoritmo de structured
 * clone do `postMessage` já sabe transferir sem serialização manual.
 */
self.onmessage = (event: MessageEvent<string>) => {
  const waveform = parseVcd(event.data);
  self.postMessage(waveform);
};

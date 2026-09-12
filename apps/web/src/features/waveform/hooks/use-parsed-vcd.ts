import { useEffect, useState } from 'react';
import type { Waveform } from '../models/types';
import VcdWorker from '../workers/vcd-worker?worker';

export interface UseParsedVcdResult {
  waveform: Waveform | null;
  isLoading: boolean;
}

/**
 * Parse de VCD em Web Worker (RF06-I04) — mantem a interface (editor, console)
 * utilizavel enquanto um arquivo grande e interpretado. Um worker novo por
 * `.vcd` recebido; o anterior e encerrado (`terminate`) se ainda estiver rodando
 * quando um novo chega ou o componente desmonta.
 */
export function useParsedVcd(vcd: string | null): UseParsedVcdResult {
  const [waveform, setWaveform] = useState<Waveform | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!vcd) {
      setWaveform(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const worker = new VcdWorker();

    worker.onmessage = (event: MessageEvent<Waveform>) => {
      setWaveform(event.data);
      setIsLoading(false);
    };

    worker.postMessage(vcd);

    return () => {
      worker.terminate();
    };
  }, [vcd]);

  return { waveform, isLoading };
}

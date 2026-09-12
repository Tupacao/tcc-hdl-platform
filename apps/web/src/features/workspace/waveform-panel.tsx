import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { WaveformCanvas } from '@/features/waveform/components/waveform-canvas';
import { parseVcd } from '@/features/waveform/utils/vcd-parser';

interface WaveformPanelProps {
  vcd: string | null;
}

/** RF06 — visualizador grafico interativo de formas de onda. */
export function WaveformPanel({ vcd }: WaveformPanelProps) {
  const waveform = useMemo(() => (vcd ? parseVcd(vcd) : null), [vcd]);

  if (!waveform) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <Activity aria-hidden className="size-6" />
        <p>
          Nenhuma forma de onda ainda. Use <code>$dumpfile</code> e <code>$dumpvars</code> no
          testbench e execute a simulacao.
        </p>
      </div>
    );
  }

  if (waveform.signals.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <Activity aria-hidden className="size-6" />
        <p>Nao foi possivel interpretar a forma de onda recebida.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {waveform.truncated && (
        <p className="border-b bg-warning/10 px-3 py-1 text-xs text-warning">
          O arquivo .vcd foi truncado; a forma de onda pode estar incompleta.
        </p>
      )}
      <div className="min-h-0 flex-1">
        <WaveformCanvas waveform={waveform} />
      </div>
    </div>
  );
}

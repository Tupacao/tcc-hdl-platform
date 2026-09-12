import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { WaveformCanvas } from '@/features/waveform/components/waveform-canvas';
import { parseVcd } from '@/features/waveform/utils/vcd-parser';
import {
  WAVEFORM_EMPTY_STATE,
  WAVEFORM_TRUNCATED_MESSAGE,
  WAVEFORM_UNPARSEABLE_MESSAGE,
} from './utils/messages';

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
          {WAVEFORM_EMPTY_STATE.BEFORE_DUMPFILE}
          <code>{WAVEFORM_EMPTY_STATE.DUMPFILE}</code>
          {WAVEFORM_EMPTY_STATE.BETWEEN_DIRECTIVES}
          <code>{WAVEFORM_EMPTY_STATE.DUMPVARS}</code>
          {WAVEFORM_EMPTY_STATE.AFTER_DUMPVARS}
        </p>
      </div>
    );
  }

  if (waveform.signals.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <Activity aria-hidden className="size-6" />
        <p>{WAVEFORM_UNPARSEABLE_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {waveform.truncated && (
        <p className="border-b bg-warning/10 px-3 py-1 text-xs text-warning">
          {WAVEFORM_TRUNCATED_MESSAGE}
        </p>
      )}
      <div className="min-h-0 flex-1">
        <WaveformCanvas waveform={waveform} />
      </div>
    </div>
  );
}

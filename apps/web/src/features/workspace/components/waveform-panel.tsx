import { Activity, Loader2 } from 'lucide-react';
import { WaveformCanvas } from '@/features/waveform/components/waveform-canvas';
import { EmptyState } from '@/components/empty-state';
import { useParsedVcd } from '@/features/waveform/hooks/use-parsed-vcd';
import {
  WAVEFORM_EMPTY_STATE,
  WAVEFORM_LOADING_MESSAGE,
  WAVEFORM_TRUNCATED_MESSAGE,
  WAVEFORM_UNPARSEABLE_MESSAGE,
} from '../utils/messages';

interface WaveformPanelProps {
  vcd: string | null;
  /**
   * RF04-I02 — `result.truncated.vcd`: o backend cortou o arquivo por teto de
   * tamanho. Sempre no fim de uma linha completa, então o parser (RF06) não
   * detecta sozinho esse corte (só detecta registro incompleto) — sem este
   * sinal explícito, um `.vcd` cortado pelo backend não mostrava aviso nenhum.
   */
  truncated?: boolean;
}

/** RF06 — visualizador gráfico interativo de formas de onda. */
export function WaveformPanel({ vcd, truncated: backendTruncated = false }: WaveformPanelProps) {
  const { waveform, isLoading } = useParsedVcd(vcd);

  if (!vcd) {
    return (
      <EmptyState
        icon={<Activity aria-hidden className="size-6 text-muted-foreground" />}
        title={WAVEFORM_EMPTY_STATE.TITLE}
        reason={WAVEFORM_EMPTY_STATE.REASON}
      >
        {WAVEFORM_EMPTY_STATE.BEFORE_DUMPFILE}
        <code>{WAVEFORM_EMPTY_STATE.DUMPFILE}</code>
        {WAVEFORM_EMPTY_STATE.BETWEEN_DIRECTIVES}
        <code>{WAVEFORM_EMPTY_STATE.DUMPVARS}</code>
        {WAVEFORM_EMPTY_STATE.AFTER_DUMPVARS}
      </EmptyState>
    );
  }

  // Worker de RF06-I04 ainda processando — a interface (editor, console) segue
  // utilizável, só este painel mostra o estado de carregamento.
  if (isLoading || !waveform) {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground"
      >
        <Loader2 aria-hidden className="size-6 animate-spin" />
        <p>{WAVEFORM_LOADING_MESSAGE}</p>
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
      {(waveform.truncated || backendTruncated) && (
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

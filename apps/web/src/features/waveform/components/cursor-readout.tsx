import type { Waveform, WaveSignal } from '../models/types';
import {
  CURSOR_READOUT_EMPTY_MESSAGE,
  CURSOR_READOUT_TITLE,
  formatCursorTimeLabel,
} from '../utils/messages';
import { valueAt } from '../utils/vcd-parser';
import { toVerilogLiteral } from '../utils/verilog-literal';

interface CursorReadoutProps {
  waveform: Waveform;
  /** Ja filtradas pela selecao de RF06-I03 — este painel e a versao acessivel do grafico. */
  rows: WaveSignal[];
  cursorTime: number;
}

/** Leitura textual dos valores no instante do cursor (RF06-I03, frame 8.2 do Figma). */
export function CursorReadout({ waveform, rows, cursorTime }: CursorReadoutProps) {
  return (
    <div className="border-t p-3">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{CURSOR_READOUT_TITLE}</h3>
        <span className="rounded-full bg-wave-cursor/10 px-2 py-0.5 text-xs font-medium text-wave-cursor">
          {formatCursorTimeLabel(cursorTime, waveform.timescale, waveform.timeUnit)}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{CURSOR_READOUT_EMPTY_MESSAGE}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((row) => {
            const value = valueAt(waveform, row.id, cursorTime);
            return (
              <div
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted px-2 py-1.5"
              >
                <span className="truncate text-xs text-muted-foreground">{row.name}</span>
                <span className="shrink-0 font-mono text-xs font-medium">
                  {toVerilogLiteral(value, row.width)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

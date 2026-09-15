import type { Waveform, WaveSignal } from '../models/types';
import {
  CURSOR_READOUT_COLUMN_SIGNAL,
  CURSOR_READOUT_COLUMN_VALUE,
  CURSOR_READOUT_EMPTY_MESSAGE,
  CURSOR_READOUT_TITLE,
  formatCursorReadoutCaption,
  formatCursorTimeLabel,
} from '../utils/messages';
import { valueAt } from '../utils/vcd-parser';
import { toVerilogLiteral } from '../utils/verilog-literal';

interface CursorReadoutProps {
  waveform: Waveform;
  /** Já filtradas pela seleção de RF06-I03 — este painel é a versão acessível do gráfico. */
  rows: WaveSignal[];
  cursorTime: number;
}

/**
 * Leitura textual dos valores no instante do cursor (RF06-I03, frame 8.2 do
 * Figma) — RF06-I04 dá a ela semântica de tabela de verdade, para navegação
 * por leitor de tela e por teclado.
 */
export function CursorReadout({ waveform, rows, cursorTime }: CursorReadoutProps) {
  return (
    <div className="border-t p-3">
      <div className="mb-2 flex items-center gap-2" aria-live="polite">
        <h3 className="text-xs font-medium text-muted-foreground">{CURSOR_READOUT_TITLE}</h3>
        <span className="rounded-full bg-wave-cursor/10 px-2 py-0.5 text-xs font-medium text-wave-cursor">
          {formatCursorTimeLabel(cursorTime, waveform.timescale, waveform.timeUnit)}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{CURSOR_READOUT_EMPTY_MESSAGE}</p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <caption className="sr-only">
            {formatCursorReadoutCaption(cursorTime, waveform.timescale, waveform.timeUnit)}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="p-1 text-left font-medium text-muted-foreground">
                {CURSOR_READOUT_COLUMN_SIGNAL}
              </th>
              <th scope="col" className="p-1 text-left font-medium text-muted-foreground">
                {CURSOR_READOUT_COLUMN_VALUE}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const value = valueAt(waveform, row.id, cursorTime);
              return (
                <tr key={row.id} className="border-t">
                  <th scope="row" className="p-1 text-left font-normal text-muted-foreground">
                    {row.name}
                  </th>
                  <td className="break-all p-1 font-mono font-medium">
                    {toVerilogLiteral(value, row.width)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

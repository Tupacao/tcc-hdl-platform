import { Activity } from 'lucide-react';

interface WaveformPanelProps {
  vcd: string | null;
}

/**
 * RF06 — visualizador grafico de formas de onda. Aqui apenas confirmamos que o
 * .vcd chegou; o renderizador (WaveDrom ou leitor de VCD proprio) entra na
 * proxima etapa, consumindo exatamente este mesmo conteudo.
 */
export function WaveformPanel({ vcd }: WaveformPanelProps) {
  if (!vcd) {
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

  const signalCount = vcd.split('\n').filter((line) => line.startsWith('$var')).length;

  return (
    <div className="h-full overflow-auto p-3">
      <p className="mb-2 text-sm text-muted-foreground">
        VCD recebido: {signalCount} sinais, {(vcd.length / 1024).toFixed(1)} KB
      </p>
      <pre className="rounded bg-muted p-2 font-mono text-[11px] leading-relaxed">
        {vcd.slice(0, 2000)}
      </pre>
    </div>
  );
}

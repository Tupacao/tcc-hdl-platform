import { Copy, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CODE_BLOCK } from '../utils/messages';

interface CodeBlockProps {
  fileName?: string;
  code: string;
  /** Omitido quando o bloco e so um fragmento ilustrativo, sem exemplo completo para abrir. */
  onOpenInEditor?: () => void;
}

/**
 * Bloco de codigo dos textos de RF11 (I02/I03). Sem realce de sintaxe de
 * proposito - a issue de estrutura (RF11-I01) veda dependencia nova alem do
 * componente shadcn/ui usado, e reaproveitar o Monaco (ja no bundle) para
 * blocos curtos e somente leitura pesaria mais instancias do que o necessario
 * sem medir antes (risco registrado no issue doc).
 */
export function CodeBlock({ fileName, code, onOpenInEditor }: CodeBlockProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(CODE_BLOCK.COPY_SUCCESS);
    } catch {
      toast.error(CODE_BLOCK.COPY_ERROR);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{fileName ?? 'Verilog'}</span>
        <div className="flex items-center gap-1">
          {onOpenInEditor && (
            <Button variant="ghost" size="sm" onClick={onOpenInEditor}>
              <FileCode aria-hidden />
              {CODE_BLOCK.OPEN_IN_EDITOR}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy aria-hidden />
            {CODE_BLOCK.COPY}
          </Button>
        </div>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

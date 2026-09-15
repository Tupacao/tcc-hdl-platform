import { Copy, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CODE_BLOCK } from '../utils/messages';
import { tokenizeVerilog, type VerilogTokenType } from '../utils/verilog-highlight';

interface CodeBlockProps {
  fileName?: string;
  code: string;
  /** Omitido quando o bloco é só um fragmento ilustrativo, sem exemplo completo para abrir. */
  onOpenInEditor?: () => void;
  /** 'text' desliga o realce - usado pelos blocos de saída do console, que não são Verilog. */
  language?: 'verilog' | 'text';
}

const TOKEN_CLASS: Partial<Record<VerilogTokenType, string>> = {
  keyword: 'text-code-keyword',
  type: 'text-code-type',
  directive: 'text-code-directive',
  number: 'text-code-number',
  string: 'text-code-string',
  comment: 'text-code-comment',
  operator: 'text-code-operator',
};

/**
 * Bloco de código dos textos de RF11 (I02/I03). Realce de sintaxe por um
 * tokenizador leve (regex de passagem única, sem dependência nova -
 * `verilog-highlight.ts`), não o Monaco: os blocos são curtos e só leitura,
 * reaproveitar o Monaco pesaria mais instâncias do que o necessário (risco
 * registrado no RF11-I01). Cores em `docs/design-system-fundamentos.md` §8.
 *
 * Hierarquia de ações fixada no Figma (7.6 "Bloco de código com duas ações"):
 * "Copiar" em contorno é a escapatória; "Abrir no editor" em laranja
 * (`variant="default"`, `--primary`) é a ação que a documentação quer
 * estimular - por isso vem depois na ordem de leitura (esquerda -> direita
 * termina no botão que se quer que a pessoa aperte).
 */
export function CodeBlock({ fileName, code, onOpenInEditor, language = 'verilog' }: CodeBlockProps) {
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
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy aria-hidden />
            {CODE_BLOCK.COPY}
          </Button>
          {onOpenInEditor && (
            <Button size="sm" onClick={onOpenInEditor}>
              <FileCode aria-hidden />
              {CODE_BLOCK.OPEN_IN_EDITOR}
            </Button>
          )}
        </div>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-code-foreground">
        <code>
          {language === 'text'
            ? code
            : tokenizeVerilog(code).map((token, index) => {
                const className = TOKEN_CLASS[token.type];
                return className ? (
                  <span key={index} className={className}>
                    {token.text}
                  </span>
                ) : (
                  token.text
                );
              })}
        </code>
      </pre>
    </div>
  );
}

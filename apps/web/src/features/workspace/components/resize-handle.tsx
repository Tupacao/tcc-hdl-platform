import { useEffect, useRef, useState } from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { RESIZE_HANDLE } from '../utils/messages';

interface ResizeHandleProps {
  /** `horizontal` = divisor vertical entre painéis lado a lado (ajusta largura). */
  direction: 'horizontal' | 'vertical';
  /** Rótulo acessível descrevendo o que o divisor ajusta. */
  label: string;
}

/**
 * Divisor de painéis com os quatro estados do Figma 2.9 (RF09-I03): repouso (linha
 * de 1px; a alça só aparece no hover), hover (alça de 8×42), arraste (linha
 * laranja e medida ao vivo dos dois lados) e foco por teclado (anel e instrução
 * de teclado). A área sensível maior que a linha vem do `hitAreaMargins` da biblioteca.
 */
export function ResizeHandle({ direction, label }: ResizeHandleProps) {
  const isColumnResize = direction === 'horizontal';
  const gripRef = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);
  const [measure, setMeasure] = useState<[number, number] | null>(null);

  // Os painéis vizinhos são irmãos do divisor no DOM: a medida vem do tamanho real.
  useEffect(() => {
    if (!dragging) {
      setMeasure(null);
      return;
    }
    const read = () => {
      const handle = gripRef.current?.parentElement;
      const before = handle?.previousElementSibling;
      const after = handle?.nextElementSibling;
      if (!before || !after) return;
      const size = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return Math.round(isColumnResize ? rect.width : rect.height);
      };
      setMeasure([size(before), size(after)]);
    };
    read();
    document.addEventListener('pointermove', read);
    return () => document.removeEventListener('pointermove', read);
  }, [dragging, isColumnResize]);

  return (
    <PanelResizeHandle
      aria-label={label}
      onDragging={setDragging}
      className={cn(
        'group relative bg-border transition-colors outline-none',
        'hover:bg-ring data-[resize-handle-state=drag]:bg-primary',
        isColumnResize ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
      )}
    >
      <span
        ref={gripRef}
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-muted-foreground/40 opacity-0 transition-opacity',
          'group-hover:opacity-100 group-data-[resize-handle-state=drag]:bg-primary group-data-[resize-handle-state=drag]:opacity-100',
          'group-focus-visible:opacity-100 group-focus-visible:border-2 group-focus-visible:border-ring group-focus-visible:bg-transparent',
          isColumnResize ? 'h-[42px] w-2' : 'h-2 w-[42px]',
          isColumnResize
            ? 'group-focus-visible:h-[50px] group-focus-visible:w-3.5'
            : 'group-focus-visible:h-3.5 group-focus-visible:w-[50px]',
        )}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute hidden font-mono text-[9.5px] whitespace-nowrap text-primary-strong group-focus-visible:block',
          isColumnResize
            ? 'top-[calc(50%+34px)] left-1/2 -translate-x-1/2'
            : 'top-3 left-1/2 -translate-x-1/2',
        )}
      >
        {isColumnResize ? RESIZE_HANDLE.KEYBOARD_HINT_COLUMN : RESIZE_HANDLE.KEYBOARD_HINT_ROW}
      </span>
      {measure && (
        <>
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute font-mono text-[9.5px] whitespace-nowrap text-primary-strong',
              isColumnResize ? 'right-2 bottom-6' : 'top-[-1.25rem] left-4',
            )}
          >
            {measure[0]} px
          </span>
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute font-mono text-[9.5px] whitespace-nowrap text-primary-strong',
              isColumnResize ? 'bottom-6 left-2' : 'top-2 left-4',
            )}
          >
            {measure[1]} px
          </span>
        </>
      )}
    </PanelResizeHandle>
  );
}

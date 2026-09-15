import type { ReactNode } from 'react';

interface NoteProps {
  title: string;
  children: ReactNode;
}

/**
 * Nota/aviso de conteúdo longo (Figma 7.1 "Nota", 7.3 "NotaPosicionamento") -
 * barra lateral de 3px em `--primary-strong`, título semibold e corpo em
 * `--muted-foreground`, 15px/1,6 (design-system-fundamentos.md §4).
 */
export function Note({ title, children }: NoteProps) {
  return (
    <div className="rounded-md border-l-[3px] border-primary-strong bg-muted/30 py-3 pr-4 pl-4">
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-1 text-[15px] leading-[1.6] text-muted-foreground">{children}</p>
    </div>
  );
}

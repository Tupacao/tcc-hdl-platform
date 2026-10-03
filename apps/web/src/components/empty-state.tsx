import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** O que é este espaço ("A saída do compilador aparece aqui"). */
  title: string;
  /** Por que está vazio ("Nenhuma execução ainda."). */
  reason?: ReactNode;
  /** O que fazer agora — texto de apoio e/ou botões. */
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Estado vazio padrão (RNF01-I02, Figma RNF01): toda tela vazia responde às mesmas três
 * perguntas, nesta ordem — o que é este espaço, por que está vazio, o que fazer agora. Ter um
 * componente único torna a consistência estrutural, não questão de disciplina.
 */
export function EmptyState({ title, reason, children, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-2 p-6 text-center',
        className,
      )}
    >
      {icon}
      <p className="text-sm font-medium">{title}</p>
      {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

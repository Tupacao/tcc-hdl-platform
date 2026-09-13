import { Copy, FolderOpen, MoreVertical, PenLine, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PROJECT_ACTIONS, PROJECT_CARD_MENU_LABEL } from '../utils/messages';

interface ProjectActionsMenuProps {
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /**
   * Chamado no `pointerdown` do gatilho "...", com o proprio botao (nao
   * `document.activeElement` - o navegador so move o foco para o botao
   * DEPOIS do pointerdown, entao lê-lo aqui ainda pegaria o elemento
   * anterior). O Radix abre o menu no `pointerdown` e suprime o `click`
   * seguinte, entao capturar em `onClick` nunca dispara. Escolher
   * "Renomear"/"Excluir" abre outro dialogo em seguida, e o Radix nao
   * restaura foco no gatilho nesse caminho (so quando o menu fecha sem
   * selecionar nada) - por isso a captura acontece aqui, guardando o
   * elemento diretamente.
   */
  onTriggerFocusable?: (trigger: HTMLButtonElement) => void;
}

/** Menu "..." do card (RF07-I02, frame 6.2 do Figma: "Menu de acoes do cartao"). */
export function ProjectActionsMenu({
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onTriggerFocusable,
}: ProjectActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={PROJECT_CARD_MENU_LABEL}
          className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onPointerDown={(event) => {
            event.stopPropagation();
            onTriggerFocusable?.(event.currentTarget);
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical aria-hidden className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={onOpen}>
          <FolderOpen aria-hidden className="size-4" />
          {PROJECT_ACTIONS.OPEN}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRename}>
          <PenLine aria-hidden className="size-4" />
          {PROJECT_ACTIONS.RENAME}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>
          <Copy aria-hidden className="size-4" />
          {PROJECT_ACTIONS.DUPLICATE}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 aria-hidden className="size-4" />
          {PROJECT_ACTIONS.DELETE}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

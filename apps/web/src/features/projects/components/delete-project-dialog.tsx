import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { LocalProject } from '../models/types';
import { DELETE_DIALOG, formatDeleteDialogTitle } from '../utils/messages';

interface DeleteProjectDialogProps {
  project: LocalProject | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
  /**
   * Chamado dentro do próprio `onCloseAutoFocus` do Radix, depois do
   * `preventDefault`. Sem `AlertDialogTrigger` fixo (aberto de vários cards),
   * o Radix tenta devolver o foco por conta própria ao fechar e vence uma
   * chamada equivalente feita em `onOpenChange` (roda depois, no commit de
   * fechamento) - fazer a restauração AQUI garante que nada roda depois.
   */
  onRestoreFocus: () => void;
}

/** Confirmação de exclusão com o nome do projeto visível (RF07-I02, frame 6.2 do Figma). */
export function DeleteProjectDialog({
  project,
  onOpenChange,
  onConfirm,
  onRestoreFocus,
}: DeleteProjectDialogProps) {
  if (!project) return null;

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{formatDeleteDialogTitle(project.name)}</AlertDialogTitle>
          <AlertDialogDescription>{DELETE_DIALOG.BODY}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{DELETE_DIALOG.CANCEL}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => onConfirm(project.id)}>
            {DELETE_DIALOG.SUBMIT}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
import { Button } from '@/components/ui/button';
import { LEAVE_DIALOG } from './utils/messages';

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Sair sem salvar" - o rascunho local continua guardado, so o projeto nao e atualizado. */
  onDiscard: () => void;
  onSaveAndLeave: () => void;
}

/** RF07-I03 - "Sair sem salvar?" ao trocar de projeto ou voltar para a lista com pendencias (Figma 6.2). */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onSaveAndLeave,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{LEAVE_DIALOG.TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{LEAVE_DIALOG.BODY}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{LEAVE_DIALOG.CANCEL}</AlertDialogCancel>
          <Button variant="outline" onClick={onDiscard}>
            {LEAVE_DIALOG.DISCARD}
          </Button>
          <AlertDialogAction onClick={onSaveAndLeave}>
            {LEAVE_DIALOG.SAVE_AND_LEAVE}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

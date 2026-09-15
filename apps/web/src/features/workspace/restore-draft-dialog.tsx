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
import { formatRelativeTime, type ProjectDraft } from '@/features/projects';
import { formatRestoreDraftBody, RESTORE_DRAFT_DIALOG } from './utils/messages';

interface RestoreDraftDialogProps {
  draft: ProjectDraft | null;
  onUseDraft: () => void;
  onDiscard: () => void;
}

/** RF07-I03 - ao abrir um projeto com rascunho local mais novo, pergunta antes de aplicar. */
export function RestoreDraftDialog({ draft, onUseDraft, onDiscard }: RestoreDraftDialogProps) {
  if (!draft) return null;

  return (
    <AlertDialog open onOpenChange={(open) => !open && onDiscard()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{RESTORE_DRAFT_DIALOG.TITLE}</AlertDialogTitle>
          <AlertDialogDescription>
            {formatRestoreDraftBody(formatRelativeTime(draft.savedAt))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>{RESTORE_DRAFT_DIALOG.DISCARD}</AlertDialogCancel>
          <AlertDialogAction onClick={onUseDraft}>
            {RESTORE_DRAFT_DIALOG.USE_DRAFT}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

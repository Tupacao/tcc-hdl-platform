import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LocalProject } from '../models/types';
import { RENAME_DIALOG } from '../utils/messages';
import { validateProjectName } from '../utils/validation';

interface RenameProjectDialogProps {
  project: LocalProject | null;
  existingNames: string[];
  onOpenChange: (open: boolean) => void;
  onRename: (id: string, name: string) => void;
  /** Ver nota em delete-project-dialog.tsx: chamado dentro do onCloseAutoFocus do Radix. */
  onRestoreFocus: () => void;
}

/** Dialogo "Renomear projeto" (RF07-I02, frame 6.2 do Figma). */
export function RenameProjectDialog({
  project,
  existingNames,
  onOpenChange,
  onRename,
  onRestoreFocus,
}: RenameProjectDialogProps) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nameInputId = useId();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setSubmitted(false);
    }
  }, [project]);

  if (!project) return null;

  // Capturado numa const local: `function handleSubmit` e hoisted, entao o TS
  // nao propaga o `if (!project) return null` acima para dentro dela.
  const currentProject = project;

  // O nome atual nao conta como duplicata dele mesmo.
  const otherNames = existingNames.filter(
    (existing) => existing.toLowerCase() !== currentProject.name.toLowerCase(),
  );
  const error = validateProjectName(name, otherNames);
  const showError = submitted && error !== null;

  function handleSubmit() {
    setSubmitted(true);
    if (error) return;
    onRename(currentProject.id, name.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{RENAME_DIALOG.TITLE}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor={nameInputId}>{RENAME_DIALOG.NAME_LABEL}</Label>
          <Input
            id={nameInputId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={showError}
            aria-describedby={showError ? `${nameInputId}-error` : `${nameInputId}-hint`}
            autoFocus
          />
          {showError && (
            <p id={`${nameInputId}-error`} className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <p
          id={`${nameInputId}-hint`}
          className="rounded-md bg-muted p-3 text-xs text-muted-foreground"
        >
          {RENAME_DIALOG.HINT}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {RENAME_DIALOG.CANCEL}
          </Button>
          <Button onClick={handleSubmit}>{RENAME_DIALOG.SUBMIT}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CreateLocalProjectInput } from '../models/types';
import { NEW_PROJECT_DIALOG } from '../utils/messages';
import { buildBlankSources, buildSampleSources } from '../utils/project-sources';
import { validateProjectName } from '../utils/validation';

type StartPoint = 'blank' | 'sample';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onCreate: (input: CreateLocalProjectInput) => void;
  defaultStartPoint?: StartPoint;
  /** Ver nota em delete-project-dialog.tsx: chamado dentro do onCloseAutoFocus do Radix. */
  onRestoreFocus: () => void;
}

/** Dialogo "Novo projeto" (RF07-I02, frame 6.2 do Figma). */
export function NewProjectDialog({
  open,
  onOpenChange,
  existingNames,
  onCreate,
  defaultStartPoint = 'blank',
  onRestoreFocus,
}: NewProjectDialogProps) {
  const [name, setName] = useState('');
  const [startPoint, setStartPoint] = useState<StartPoint>(defaultStartPoint);
  const [submitted, setSubmitted] = useState(false);
  const nameInputId = useId();

  const error = validateProjectName(name, existingNames);
  const showError = submitted && error !== null;

  // O dialogo fica montado entre aberturas (RF07-I02): sincroniza o ponto de
  // partida com o que o botao de origem pediu (branco vs. exemplo) toda vez
  // que ele abre, em vez de so na primeira montagem.
  useEffect(() => {
    if (!open) return;
    setName('');
    setStartPoint(defaultStartPoint);
    setSubmitted(false);
  }, [open, defaultStartPoint]);

  function reset() {
    setName('');
    setStartPoint(defaultStartPoint);
    setSubmitted(false);
  }

  function handleSubmit() {
    setSubmitted(true);
    if (error) return;

    const trimmed = name.trim();
    const sources =
      startPoint === 'blank' ? buildBlankSources(trimmed) : buildSampleSources(trimmed);
    onCreate({ name: trimmed, sources });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{NEW_PROJECT_DIALOG.TITLE}</DialogTitle>
          <DialogDescription>{NEW_PROJECT_DIALOG.DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor={nameInputId}>{NEW_PROJECT_DIALOG.NAME_LABEL}</Label>
          <Input
            id={nameInputId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={showError}
            aria-describedby={showError ? `${nameInputId}-error` : `${nameInputId}-hint`}
            autoFocus
          />
          {showError ? (
            <p id={`${nameInputId}-error`} className="text-xs text-destructive">
              {error}
            </p>
          ) : (
            <p id={`${nameInputId}-hint`} className="text-xs text-muted-foreground">
              {NEW_PROJECT_DIALOG.NAME_HINT}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{NEW_PROJECT_DIALOG.START_LABEL}</span>
          <RadioGroup
            value={startPoint}
            onValueChange={(value) => setStartPoint(value as StartPoint)}
          >
            <StartOption
              id="blank"
              title={NEW_PROJECT_DIALOG.START_BLANK_TITLE}
              subtitle={NEW_PROJECT_DIALOG.START_BLANK_SUBTITLE}
            />
            <StartOption
              id="sample"
              title={NEW_PROJECT_DIALOG.START_SAMPLE_TITLE}
              subtitle={NEW_PROJECT_DIALOG.START_SAMPLE_SUBTITLE}
            />
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {NEW_PROJECT_DIALOG.CANCEL}
          </Button>
          <Button onClick={handleSubmit}>{NEW_PROJECT_DIALOG.SUBMIT}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StartOption({ id, title, subtitle }: { id: StartPoint; title: string; subtitle: string }) {
  return (
    <Label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
    >
      <RadioGroupItem value={id} id={id} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </Label>
  );
}

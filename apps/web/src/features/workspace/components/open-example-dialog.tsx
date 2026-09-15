import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  formatOpenExampleTitle,
  formatReplaceCurrentSubtitle,
  OPEN_EXAMPLE_DIALOG,
} from '../utils/messages';

type OpenMode = 'new' | 'replace';

interface OpenExampleDialogProps {
  /** `null` fecha o diálogo - só existe pra escolher quando há projeto aberto (App.tsx). */
  projectName: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: OpenMode) => void;
}

/**
 * "Onde abrir" (RF11-I01, Figma 7.6) - só aparece quando há um projeto
 * aberto, independente de estar salvo ou não (diferente do diálogo "Sair
 * sem salvar?" de RF07-I03, que é sobre alterações não salvas). "Abrir em
 * um projeto novo" vem marcado por padrão porque é a opção não destrutiva;
 * "Substituir" nunca vem pré-selecionada - quem aperta Enter sem ler não
 * deveria perder o que escreveu.
 */
export function OpenExampleDialog({
  projectName,
  onOpenChange,
  onConfirm,
}: OpenExampleDialogProps) {
  const [mode, setMode] = useState<OpenMode>('new');

  if (!projectName) return null;

  function handleSubmit() {
    onConfirm(mode);
    setMode('new');
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatOpenExampleTitle(projectName)}</DialogTitle>
          <DialogDescription>{OPEN_EXAMPLE_DIALOG.DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(value) => setMode(value as OpenMode)}>
          <Option
            id="new"
            title={OPEN_EXAMPLE_DIALOG.OPEN_AS_NEW_TITLE}
            subtitle={OPEN_EXAMPLE_DIALOG.OPEN_AS_NEW_SUBTITLE}
          />
          <Option
            id="replace"
            title={OPEN_EXAMPLE_DIALOG.REPLACE_CURRENT_TITLE}
            subtitle={formatReplaceCurrentSubtitle(projectName)}
          />
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {OPEN_EXAMPLE_DIALOG.CANCEL}
          </Button>
          <Button onClick={handleSubmit}>{OPEN_EXAMPLE_DIALOG.SUBMIT}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Option({ id, title, subtitle }: { id: OpenMode; title: string; subtitle: string }) {
  return (
    <Label
      htmlFor={`open-example-${id}`}
      className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
    >
      <RadioGroupItem value={id} id={`open-example-${id}`} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </Label>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  SHORTCUTS,
  SHORTCUTS_DIALOG,
  formatCombo,
  getShortcut,
  isMacPlatform,
} from '../utils/shortcuts';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KEY_CHIP_CLASS = 'rounded-[5px] border bg-muted px-2 py-0.5 font-mono text-[11px]';

/** RF09-I02 - ajuda gerada do registro central de atalhos; layout do Figma 2.9. */
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const isMac = isMacPlatform();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex-row items-center justify-between pr-8">
          <DialogTitle>{SHORTCUTS_DIALOG.TITLE}</DialogTitle>
          <kbd aria-hidden className={cn(KEY_CHIP_CLASS, 'font-bold')}>
            {getShortcut('help').combo.key}
          </kbd>
        </DialogHeader>
        <DialogDescription className="sr-only">{SHORTCUTS_DIALOG.DESCRIPTION}</DialogDescription>
        <ul className="flex flex-col">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.id}
              className="flex items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-[12.5px] even:bg-muted/60"
            >
              <span>{shortcut.description}</span>
              <kbd className={KEY_CHIP_CLASS}>{formatCombo(shortcut.combo, isMac).join(' ')}</kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

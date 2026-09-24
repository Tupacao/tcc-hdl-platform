import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SCOPE_LABELS,
  SHORTCUTS,
  SHORTCUTS_DIALOG,
  formatCombo,
  isMacPlatform,
  type ShortcutScope,
} from '../utils/shortcuts';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCOPES: ShortcutScope[] = ['global', 'editor'];

/** RF09-I02 - ajuda gerada a partir do registro central de atalhos. */
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const isMac = isMacPlatform();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{SHORTCUTS_DIALOG.TITLE}</DialogTitle>
          <DialogDescription>{SHORTCUTS_DIALOG.DESCRIPTION}</DialogDescription>
        </DialogHeader>
        {SCOPES.map((scope) => (
          <section key={scope} aria-label={SCOPE_LABELS[scope]}>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">
              {SCOPE_LABELS[scope]}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {SHORTCUTS.filter((shortcut) => shortcut.scope === scope).map((shortcut) => (
                <li key={shortcut.id} className="flex items-center justify-between gap-4 text-sm">
                  <span>{shortcut.description}</span>
                  <span className="flex gap-1">
                    {formatCombo(shortcut.combo, isMac).map((key) => (
                      <kbd
                        key={key}
                        className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  );
}

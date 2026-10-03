import { useState } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CAPABILITY_LABELS, detectMissingCapabilities } from '@/lib/browser-support';
import { readDismissed, sessionStorageOrNull, writeDismissed } from '../utils/dismissal';
import {
  BANNER_REGION_LABEL,
  BANNER_TEXT,
  BROWSERS_DIALOG,
  DISMISS_LABEL,
  SEE_BROWSERS_LABEL,
  TESTED_BROWSERS,
} from '../utils/messages';

/**
 * Faixa informativa no topo (RNF02, Figma 10.4): aparece só quando falta uma API de que a
 * aplicação depende, é dispensável e EMPURRA o conteúdo (é um bloco do fluxo, nunca
 * sobreposta — o botão Executar não pode ficar atrás de nada). Nunca bloqueia o uso.
 */
export function BrowserSupportBanner() {
  const [missing] = useState(detectMissingCapabilities);
  const [dismissed, setDismissed] = useState(() => readDismissed(sessionStorageOrNull()));
  const [browsersOpen, setBrowsersOpen] = useState(false);

  if (missing.length === 0 || dismissed) return null;

  return (
    <>
      <div
        role="region"
        aria-label={BANNER_REGION_LABEL}
        className="flex shrink-0 items-center gap-3 border-b border-border bg-muted px-4 py-2 text-sm text-foreground"
      >
        <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
        <p className="min-w-0 flex-1">{BANNER_TEXT}</p>
        <Button variant="link" size="sm" onClick={() => setBrowsersOpen(true)}>
          {SEE_BROWSERS_LABEL}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={DISMISS_LABEL}
          onClick={() => {
            writeDismissed(sessionStorageOrNull());
            setDismissed(true);
          }}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <Dialog open={browsersOpen} onOpenChange={setBrowsersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{BROWSERS_DIALOG.title}</DialogTitle>
            <DialogDescription>{BROWSERS_DIALOG.description}</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {TESTED_BROWSERS.map((browser) => (
              <li key={browser.name}>
                {browser.name} {browser.minVersion}+
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {BROWSERS_DIALOG.missingPrefix} {missing.map((c) => CAPABILITY_LABELS[c]).join(', ')}.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

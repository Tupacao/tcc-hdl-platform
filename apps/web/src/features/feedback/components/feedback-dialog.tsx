import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, X } from 'lucide-react';
import { FEEDBACK_MESSAGE_MAX, type CreateFeedback } from '@tplab/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useSendFeedback } from '../hooks/use-send-feedback';
import type { ContextLine, OfferedFeedbackKind } from '../models/feedback';
import { collectFeedbackContext, describeFeedbackContext } from '../utils/collect-context';
import {
  FEEDBACK_DIALOG,
  FEEDBACK_ERROR,
  FEEDBACK_KIND_GROUP_LABEL,
  FEEDBACK_KIND_LABELS,
  FEEDBACK_LIMIT,
  formatCharacterCount,
} from '../utils/messages';
import { readRunContext } from '../utils/run-context';
import { localStorageOrNull, readOrCreateSessionId } from '../utils/session';
import { canSubmit, validateFeedback, type FeedbackFieldErrors } from '../utils/validate';

const KINDS = Object.keys(FEEDBACK_KIND_LABELS) as OfferedFeedbackKind[];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Formulário de feedback (RF17-I02, Figma 10.1 e 10.5). Alcançável de qualquer
 * tela pela barra de estado e pelos cabeçalhos de projetos e documentação.
 *
 * Três decisões do design que o código precisa preservar:
 * 1. o tipo vem antes do texto — classificar é mais fácil que redigir, e quem
 *    desiste no meio já deixou a informação mais útil;
 * 2. a validação só aparece depois da primeira tentativa de enviar;
 * 3. o texto nunca é apagado antes da confirmação do servidor.
 */
export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [kind, setKind] = useState<OfferedFeedbackKind>('problema');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [attachContext, setAttachContext] = useState(true);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const { state, submit, reset } = useSendFeedback();
  /**
   * O diálogo é controlado pelo App (alcançável de qualquer tela), então não há
   * `DialogTrigger` do Radix para onde devolver o foco ao fechar — sem isto, sair
   * por `Esc` joga o foco no documento e quem navega por teclado recomeça do topo.
   */
  const triggerRef = useRef<HTMLElement | null>(null);

  const run = readRunContext();
  const context = useMemo(
    () =>
      collectFeedbackContext({
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        sessionId: readOrCreateSessionId(localStorageOrNull()),
        run,
      }),
    // Recalcula a cada abertura: a última execução pode ter mudado desde a anterior.
    [open, run],
  );
  const contextLines = useMemo(() => describeFeedbackContext(context, run), [context, run]);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      return;
    }
    const trigger = triggerRef.current;
    triggerRef.current = null;
    // Depois de o Radix terminar de desmontar a sobreposição.
    const timer = setTimeout(() => trigger?.focus?.(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  // Fechado, volta ao estado limpo — mas só apaga o texto se o servidor confirmou.
  useEffect(() => {
    if (open) return;
    if (state.kind === 'sent') {
      setMessage('');
      setContact('');
      setKind('problema');
    }
    setAttempted(false);
    setErrors({});
    setContextExpanded(false);
    reset();
  }, [open, state.kind, reset]);

  const sending = state.kind === 'sending';
  const ready = canSubmit(message);

  async function handleSubmit() {
    setAttempted(true);
    const body: CreateFeedback = {
      kind,
      message: message.trim(),
      ...(contact.trim() ? { contact: contact.trim() } : {}),
      ...(attachContext ? { context } : {}),
    };

    const found = validateFeedback(body);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // O fechamento é a confirmação: o diálogo só sai da tela depois do 201 do
    // servidor, e falha (ou limite diário) mantém ele aberto com o texto intacto.
    if (await submit(body)) onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Durante o envio o diálogo não fecha: o relato ainda não está em lugar nenhum.
        if (sending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {state.kind === 'limited' ? FEEDBACK_LIMIT.TITLE : FEEDBACK_DIALOG.TITLE}
          </DialogTitle>
          <DialogDescription>
            {state.kind === 'limited' ? FEEDBACK_LIMIT.DESCRIPTION : FEEDBACK_DIALOG.DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        {state.kind === 'limited' ? (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>{FEEDBACK_LIMIT.CLOSE}</Button>
          </DialogFooter>
        ) : (
          <>
            <fieldset className="flex flex-wrap gap-2" disabled={sending}>
              <legend className="sr-only">{FEEDBACK_KIND_GROUP_LABEL}</legend>
              {KINDS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={kind === option}
                  onClick={() => setKind(option)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    kind === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground hover:text-foreground',
                  )}
                >
                  {FEEDBACK_KIND_LABELS[option]}
                </button>
              ))}
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="feedback-message" className="sr-only">
                {FEEDBACK_DIALOG.MESSAGE_LABEL}
              </Label>
              <Textarea
                id="feedback-message"
                value={message}
                disabled={sending}
                rows={4}
                maxLength={FEEDBACK_MESSAGE_MAX}
                placeholder={FEEDBACK_DIALOG.MESSAGE_PLACEHOLDER}
                aria-invalid={attempted && Boolean(errors.message)}
                aria-describedby="feedback-message-help"
                onChange={(event) => setMessage(event.target.value)}
                className={cn(attempted && errors.message && 'border-destructive')}
              />
              <div
                id="feedback-message-help"
                className="flex items-start justify-between gap-3 text-xs"
              >
                <span className="text-destructive" role={attempted ? 'alert' : undefined}>
                  {attempted && errors.message ? errors.message : ''}
                </span>
                <span className="shrink-0 font-mono text-muted-foreground">
                  {formatCharacterCount(message.trim().length, FEEDBACK_MESSAGE_MAX)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="feedback-contact" className="text-xs text-muted-foreground">
                {FEEDBACK_DIALOG.CONTACT_LABEL}
              </Label>
              <Input
                id="feedback-contact"
                type="email"
                value={contact}
                disabled={sending}
                placeholder={FEEDBACK_DIALOG.CONTACT_PLACEHOLDER}
                aria-invalid={attempted && Boolean(errors.contact)}
                aria-describedby="feedback-contact-help"
                onChange={(event) => setContact(event.target.value)}
                className={cn(attempted && errors.contact && 'border-destructive')}
              />
              <p id="feedback-contact-help" className="text-xs text-muted-foreground">
                {attempted && errors.contact ? (
                  <span className="text-destructive">{errors.contact}</span>
                ) : (
                  FEEDBACK_DIALOG.CONTACT_HINT
                )}
              </p>
            </div>

            <ContextBlock
              attached={attachContext}
              expanded={contextExpanded}
              disabled={sending}
              lines={contextLines}
              onToggleAttached={setAttachContext}
              onToggleExpanded={() => setContextExpanded((value) => !value)}
            />

            {/* O aviso tambem existe fora do bloco expansivel (Figma 10.1): quem nao abre a lista continua lendo a promessa. */}
            <p className="font-mono text-xs text-muted-foreground">
              {FEEDBACK_DIALOG.PRIVACY_NOTE}
            </p>

            {state.kind === 'failed' && (
              <ErrorPanel
                title={FEEDBACK_ERROR.TITLE}
                description={state.message || FEEDBACK_ERROR.DESCRIPTION}
              />
            )}

            <DialogFooter>
              <Button variant="outline" disabled={sending} onClick={() => onOpenChange(false)}>
                {FEEDBACK_DIALOG.CANCEL}
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={sending || !ready}
                aria-busy={sending}
              >
                {sending && <Loader2 aria-hidden className="animate-spin" />}
                <span aria-live="polite">
                  {sending
                    ? FEEDBACK_DIALOG.SUBMITTING
                    : state.kind === 'failed'
                      ? FEEDBACK_DIALOG.RETRY
                      : FEEDBACK_DIALOG.SUBMIT}
                </span>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ContextBlockProps {
  attached: boolean;
  expanded: boolean;
  disabled: boolean;
  lines: ContextLine[];
  onToggleAttached: (value: boolean) => void;
  onToggleExpanded: () => void;
}

/**
 * O interruptor sozinho pedia confiança cega (Figma 10.5): aberto, mostra item a
 * item o que vai junto — inclusive a saída do compilador, o dado mais útil para
 * quem recebe e o mais pessoal que alguém poderia supor que fosse enviado.
 */
function ContextBlock({
  attached,
  expanded,
  disabled,
  lines,
  onToggleAttached,
  onToggleExpanded,
}: ContextBlockProps) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between gap-3 p-3">
        <Label
          htmlFor="feedback-context"
          className="flex cursor-pointer flex-col items-start gap-1"
        >
          <span className="text-sm font-medium">{FEEDBACK_DIALOG.CONTEXT_TITLE}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {FEEDBACK_DIALOG.CONTEXT_SUBTITLE}
          </span>
        </Label>
        <Checkbox
          id="feedback-context"
          checked={attached}
          disabled={disabled}
          onCheckedChange={(checked) => onToggleAttached(checked === true)}
        />
      </div>

      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-controls="feedback-context-list"
        className="flex w-full items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {expanded ? (
          <ChevronDown aria-hidden className="size-3.5" />
        ) : (
          <ChevronRight aria-hidden className="size-3.5" />
        )}
        {expanded ? FEEDBACK_DIALOG.CONTEXT_COLLAPSE : FEEDBACK_DIALOG.CONTEXT_EXPAND}
      </button>

      {expanded && (
        <dl id="feedback-context-list" className="flex flex-col gap-2 border-t px-3 py-3 text-xs">
          {lines.length === 0 && (
            <p className="text-muted-foreground">{FEEDBACK_DIALOG.CONTEXT_EMPTY}</p>
          )}
          {lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 font-mono text-muted-foreground">{line.label}</dt>
              <dd className="truncate font-mono text-foreground" title={line.value}>
                {line.value}
              </dd>
            </div>
          ))}
          <p className="mt-1 flex items-center gap-2 rounded-sm bg-muted px-2 py-1.5 text-muted-foreground">
            <X aria-hidden className="size-3.5 text-destructive" />
            {FEEDBACK_DIALOG.NEVER_SENT}
          </p>
        </dl>
      )}
    </div>
  );
}

/**
 * Só a falha tem painel. O envio bem-sucedido não mostra nada: o diálogo fecha, e
 * é o fechamento que confirma — uma tela de "obrigado" que some sozinha obriga a
 * esperar para voltar ao trabalho.
 */
function ErrorPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3" role="status" aria-live="polite">
      <AlertTriangle aria-hidden className="mt-0.5 size-4 text-destructive" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

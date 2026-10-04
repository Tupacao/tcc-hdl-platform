import type { FeedbackContext } from '@tplab/shared';
import type { ContextLine, RunContextSnapshot } from '../models/feedback';
import { FEEDBACK_CONTEXT_LABELS, formatSessionValue } from './messages';

/**
 * Nome legível do navegador a partir do `userAgent`. Heurística curta e
 * deliberadamente burra: o valor exato vai no `userAgent` enviado; isto é só o
 * que a pessoa lê na lista antes de enviar.
 */
export function describeBrowser(userAgent: string): string {
  const browser =
    /Edg\/(\d+)/.exec(userAgent)?.[0].replace('Edg/', 'Edge ') ??
    /OPR\/(\d+)/.exec(userAgent)?.[0].replace('OPR/', 'Opera ') ??
    /Firefox\/(\d+)/.exec(userAgent)?.[0].replace('/', ' ') ??
    (/Chrome\/(\d+)/.test(userAgent)
      ? `Chrome ${/Chrome\/(\d+)/.exec(userAgent)?.[1]}`
      : /Version\/(\d+).*Safari/.test(userAgent)
        ? `Safari ${/Version\/(\d+)/.exec(userAgent)?.[1]}`
        : null);

  const system = /Windows NT 10/.test(userAgent)
    ? 'Windows'
    : /Mac OS X/.test(userAgent)
      ? 'macOS'
      : /Linux/.test(userAgent)
        ? 'Linux'
        : null;

  if (!browser) return system ?? userAgent.slice(0, 60);
  return system ? `${browser} · ${system}` : browser;
}

export interface CollectContextInput {
  userAgent: string;
  viewport: { width: number; height: number };
  sessionId: string;
  run: RunContextSnapshot;
}

/**
 * Monta o contexto técnico enviado junto do relato (RF17-I02). A lista é curta
 * de propósito e **nunca** inclui o código do circuito — só o que ajuda a
 * reproduzir o que a pessoa descreveu.
 */
export function collectFeedbackContext(input: CollectContextInput): FeedbackContext {
  return {
    userAgent: input.userAgent,
    viewport: `${input.viewport.width}x${input.viewport.height}`,
    sessionId: input.sessionId,
    ...(input.run.projectId ? { projectId: input.run.projectId } : {}),
    ...(input.run.lastRun ? { lastFailure: input.run.lastRun.split(' · ')[0] } : {}),
    ...(input.run.compilerOutput ? { compilerOutput: input.run.compilerOutput } : {}),
  };
}

/**
 * A mesma informação, em linhas legíveis — é o que o bloco expansível mostra.
 * Deriva do contexto que será enviado (e não de uma segunda fonte) para que o
 * que a pessoa lê seja exatamente o que sai.
 */
export function describeFeedbackContext(
  context: FeedbackContext,
  run: RunContextSnapshot,
): ContextLine[] {
  const lines: ContextLine[] = [];

  if (context.userAgent) {
    lines.push({
      label: FEEDBACK_CONTEXT_LABELS.browser,
      value: describeBrowser(context.userAgent),
    });
  }
  if (context.viewport) {
    lines.push({
      label: FEEDBACK_CONTEXT_LABELS.screen,
      value: context.viewport.replace('x', ' × '),
    });
  }
  if (run.projectName) {
    lines.push({ label: FEEDBACK_CONTEXT_LABELS.project, value: run.projectName });
  }
  if (run.lastRun) {
    lines.push({ label: FEEDBACK_CONTEXT_LABELS.lastRun, value: run.lastRun });
  }
  if (context.compilerOutput) {
    lines.push({ label: FEEDBACK_CONTEXT_LABELS.compilerOutput, value: context.compilerOutput });
  }
  if (context.sessionId) {
    lines.push({
      label: FEEDBACK_CONTEXT_LABELS.session,
      value: formatSessionValue(context.sessionId),
    });
  }

  return lines;
}

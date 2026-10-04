import type { Diagnostic, SimulationResult } from '@tplab/shared';
import type { RunContextSnapshot } from '../models/feedback';

/**
 * Última execução desta aba, lembrada para o contexto técnico do feedback
 * (RF17-I02). Fica em memória de módulo, e não no estado do React, porque o
 * diálogo é alcançável de qualquer tela (workspace, projetos, documentação) e o
 * dado nasce no workspace — passar isso por props obrigaria todas as telas a
 * carregarem um estado que não usam. Some ao recarregar a página, que é o
 * comportamento correto: é o contexto *desta* sessão de trabalho.
 */
let lastRun: RunContextSnapshot = {
  projectName: null,
  projectId: null,
  lastRun: null,
  compilerOutput: null,
};

export function rememberRunContext(snapshot: RunContextSnapshot): void {
  lastRun = snapshot;
}

export function readRunContext(): RunContextSnapshot {
  return lastRun;
}

/** Só para teste: devolve o módulo ao estado inicial. */
export function resetRunContext(): void {
  lastRun = { projectName: null, projectId: null, lastRun: null, compilerOutput: null };
}

const MAX_COMPILER_OUTPUT = 400;

/**
 * Primeira mensagem de erro do compilador, ou o começo do stderr. É o dado mais
 * útil para reproduzir o problema relatado — e, por isso mesmo, aparece item a
 * item na lista mostrada antes do envio (Figma 10.5), nunca escondido.
 */
export function pickCompilerOutput(result: SimulationResult | null): string | null {
  if (!result) return null;

  const firstError = result.diagnostics.find(
    (diagnostic: Diagnostic) => diagnostic.severity === 'error',
  );
  const raw = firstError?.raw ?? result.stderr.split('\n').find((line) => line.trim().length > 0);

  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > MAX_COMPILER_OUTPUT
    ? `${trimmed.slice(0, MAX_COMPILER_OUTPUT)}…`
    : trimmed;
}

/** Resumo legível do desfecho, no vocabulário do glossário (erro/aviso, não "diagnóstico"). */
export function describeLastRun(result: SimulationResult | null): string | null {
  if (!result) return null;

  const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const outcome = result.failure === null ? 'sem erros' : 'falhou';
  const duration = `${(result.durationMs / 1000).toFixed(2).replace('.', ',')} s`;

  return errors > 0
    ? `${outcome} · ${errors} ${errors === 1 ? 'erro' : 'erros'} · ${duration}`
    : `${outcome} · ${duration}`;
}

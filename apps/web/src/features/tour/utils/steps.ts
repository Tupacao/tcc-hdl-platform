import { TOUR_ANCHORS, findAnchor, type TourAnchor } from './anchors';

/** Um passo do roteiro. O texto é curto de propósito: uma ideia por balão. */
export interface TourStep {
  anchor: TourAnchor;
  title: string;
  body: string;
  /** Linha de atalho mostrada abaixo do texto, quando o passo tem um. */
  hint?: string;
  /** Tecla do atalho, mostrada em destaque antes da dica. */
  shortcut?: 'run';
  side: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Roteiro do tour (RF16-I01, Figma 7.4), na ordem do fluxo de trabalho. Os
 * textos seguem o vocabulário de `docs/GLOSSARIO.md` (circuito, testbench,
 * Executar, Problemas, Console, forma de onda) e o guia de início rápido de
 * RF11 — quem fizer o tour e depois ler a documentação encontra as mesmas
 * palavras.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    anchor: TOUR_ANCHORS.EDITOR,
    title: 'Escreva o circuito',
    body: 'Aqui fica o código do seu circuito, já com um exemplo pronto para você executar e modificar. Os erros do compilador aparecem sublinhados na própria linha.',
    side: 'right',
  },
  {
    anchor: TOUR_ANCHORS.FILE_TABS,
    title: 'Dois arquivos, dois papéis',
    body: 'O circuito descreve o hardware; o testbench o exercita com os valores de entrada e manda gravar a forma de onda. Os dois são necessários para simular.',
    side: 'bottom',
  },
  {
    anchor: TOUR_ANCHORS.RUN_BUTTON,
    title: 'Executar o circuito',
    body: 'Este botão faz as duas coisas de uma vez: compila o circuito e roda o testbench. O rótulo muda enquanto trabalha, então dá para acompanhar em que fase está.',
    hint: 'funciona de qualquer lugar da tela',
    shortcut: 'run',
    side: 'bottom',
  },
  {
    anchor: TOUR_ANCHORS.CONSOLE,
    title: 'Console e Problemas',
    body: 'A saída da execução vem no Console. Em Problemas, cada erro e cada aviso é clicável e leva direto à linha que o causou.',
    side: 'top',
  },
  {
    anchor: TOUR_ANCHORS.WAVEFORM,
    title: 'Leia as formas de onda',
    body: 'Os sinais gravados pelo testbench aparecem aqui ao longo do tempo. Para refazer este tour depois, use o menu de ajuda no topo.',
    side: 'left',
  },
];

/**
 * Passos cujas âncoras existem na tela agora. Âncora ausente é passo pulado —
 * um tour quebrado nunca pode quebrar a aplicação (RF16-I01). Em
 * desenvolvimento o passo pulado vira aviso no console, que é a única forma de
 * alguém descobrir que a marcação mudou.
 */
export function availableSteps(
  steps: readonly TourStep[] = TOUR_STEPS,
  root: ParentNode = document,
  warn: (message: string) => void = () => undefined,
): TourStep[] {
  return steps.filter((step) => {
    if (findAnchor(step.anchor, root)) return true;
    warn(`tour: âncora "${step.anchor}" não está na tela; o passo foi pulado (RF16-I01)`);
    return false;
  });
}

/**
 * Tecla do atalho no formato de cada plataforma. O mesmo atalho de RF09-I02,
 * escrito aqui com a própria checagem de plataforma para não acoplar o tour ao
 * workspace por uma linha.
 */
export function shortcutLabel(shortcut: NonNullable<TourStep['shortcut']>): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  return shortcut === 'run' ? (isMac ? '⌘ Enter' : 'Ctrl + Enter') : '';
}

/** "3 de 5" — o contador do balão (Figma 7.7). */
export function formatStepCounter(current: number, total: number): string {
  return `${current} de ${total}`;
}

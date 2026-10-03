import { useCallback, useEffect, useRef } from 'react';
import { driver, type Driver, type PopoverDOM } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../styles/tour.css';
import { anchorSelector } from '../utils/anchors';
import { TOUR_BUTTONS, TOUR_DIALOG_LABEL } from '../utils/messages';
import { availableSteps, formatStepCounter, shortcutLabel, type TourStep } from '../utils/steps';
import { hasSeenTour, isDeepLink, localStorageOrNull, markTourSeen } from '../utils/storage';

/** Véu sempre preto nos dois temas (Figma 7.7); no claro basta menos opacidade. */
const OVERLAY_OPACITY = { light: 0.5, dark: 0.68 } as const;

function overlayOpacity(): number {
  return document.documentElement.classList.contains('dark')
    ? OVERLAY_OPACITY.dark
    : OVERLAY_OPACITY.light;
}

/**
 * Monta o rodapé do balão como o Figma 7.7 pede: pontos de progresso à esquerda
 * (o ativo vira uma barra), "Pular" como texto e "Próximo" como único botão com
 * peso visual. O `driver.js` só oferece um contador textual, então o resto é
 * montado aqui, sobre os elementos que ele já criou.
 */
function renderPopover(popover: PopoverDOM, steps: TourStep[], index: number): void {
  popover.wrapper.setAttribute('role', 'dialog');
  popover.wrapper.setAttribute('aria-label', TOUR_DIALOG_LABEL);

  // Cabeçalho: título à esquerda, contador como etiqueta à direita ("3 de 5").
  const header = document.createElement('div');
  header.className = 'tplab-tour__header';
  popover.title.insertAdjacentElement('beforebegin', header);
  popover.progress.textContent = formatStepCounter(index + 1, steps.length);
  header.append(popover.title, popover.progress);

  const step = steps[index];
  if (step?.hint) {
    const row = document.createElement('p');
    row.className = 'tplab-tour__hint';
    if (step.shortcut) {
      const key = document.createElement('kbd');
      key.className = 'tplab-tour__key';
      key.textContent = shortcutLabel(step.shortcut);
      row.append(key);
    }
    row.append(document.createTextNode(step.hint));
    popover.description.insertAdjacentElement('afterend', row);
  }

  // Rodapé: pontos de progresso, "Pular" como texto e só então os botões.
  const dots = document.createElement('div');
  dots.className = 'tplab-tour__dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let position = 0; position < steps.length; position++) {
    const dot = document.createElement('span');
    dot.className =
      position === index ? 'tplab-tour__dot tplab-tour__dot--active' : 'tplab-tour__dot';
    dots.append(dot);
  }

  popover.closeButton.textContent = TOUR_BUTTONS.SKIP;
  popover.closeButton.classList.add('tplab-tour__skip');
  popover.footer.prepend(dots, popover.closeButton);

  // No primeiro passo não há "Anterior": um botão desabilitado só ocupa espaço
  // e dá ao olho mais uma coisa para descartar.
  popover.previousButton.hidden = index === 0;
}

export interface UseTourOptions {
  /**
   * O tour só começa com a interface pronta — o Monaco carrega de forma
   * assíncrona, e destacar um editor ainda em "Carregando editor..." é pior que
   * não destacar (RF16-I01).
   */
  ready: boolean;
}

/**
 * Tour guiado de primeiro acesso (RF16). Roda uma vez, é dispensável a qualquer
 * momento e pode ser refeito pelo menu de ajuda.
 */
export function useTour({ ready }: UseTourOptions) {
  const driverRef = useRef<Driver | null>(null);
  const startedRef = useRef(false);
  /** Para onde devolver o foco quando o tour terminar. */
  const originRef = useRef<HTMLElement | null>(null);

  const start = useCallback(() => {
    const steps = availableSteps(
      undefined,
      document,
      import.meta.env.DEV ? (message) => console.warn(message) : undefined,
    );
    // Sem nenhuma âncora na tela não há tour para rodar — e nada quebra.
    if (steps.length === 0) return;

    originRef.current = document.activeElement as HTMLElement | null;
    driverRef.current?.destroy();

    const instance = driver({
      showProgress: true,
      allowClose: true,
      overlayColor: '#000',
      overlayOpacity: overlayOpacity(),
      popoverClass: 'tplab-tour',
      nextBtnText: TOUR_BUTTONS.NEXT,
      prevBtnText: TOUR_BUTTONS.PREVIOUS,
      doneBtnText: TOUR_BUTTONS.DONE,
      showButtons: ['next', 'previous', 'close'],
      steps: steps.map((step) => ({
        element: anchorSelector(step.anchor),
        popover: { title: step.title, description: step.body, side: step.side, align: 'start' },
      })),
      onPopoverRender: (popover, { state }) => {
        renderPopover(popover, steps, state.activeIndex ?? 0);
      },
      // Concluir e pular marcam igual: pular é uma decisão do usuário.
      onDestroyed: () => {
        markTourSeen(localStorageOrNull());
        originRef.current?.focus?.();
        originRef.current = null;
      },
    });

    driverRef.current = instance;
    instance.drive();
  }, []);

  useEffect(() => {
    if (!ready || startedRef.current) return;
    if (hasSeenTour(localStorageOrNull())) return;
    if (isDeepLink(window.location)) return;

    startedRef.current = true;
    start();
  }, [ready, start]);

  useEffect(() => () => driverRef.current?.destroy(), []);

  return { start };
}

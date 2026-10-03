import { useCallback, useState } from 'react';
import type { CreateFeedback } from '@tplab/shared';
import { ApiRequestError, sendFeedback } from '@/lib/api';
import { FEEDBACK_ERROR } from '../utils/messages';
import type { FeedbackSubmitState } from '../models/feedback';

/**
 * Envio do relato (RF17-I02). O estado cobre os quatro desfechos do Figma 10.5:
 * enviando, recebido, falha (com o texto preservado) e limite diário atingido.
 */
export function useSendFeedback() {
  const [state, setState] = useState<FeedbackSubmitState>({ kind: 'editing' });

  const submit = useCallback(async (body: CreateFeedback): Promise<boolean> => {
    setState({ kind: 'sending' });
    try {
      await sendFeedback(body);
      setState({ kind: 'sent' });
      return true;
    } catch (error) {
      // 429 tem tela própria: não é falha de envio, é cota do dia (Figma 10.5).
      if (error instanceof ApiRequestError && error.status === 429) {
        setState({ kind: 'limited' });
        return false;
      }
      setState({
        kind: 'failed',
        message: error instanceof ApiRequestError ? error.message : FEEDBACK_ERROR.DESCRIPTION,
      });
      return false;
    }
  }, []);

  const reset = useCallback(() => setState({ kind: 'editing' }), []);

  return { state, submit, reset };
}

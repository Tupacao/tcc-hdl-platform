import { z } from 'zod';
import { IdSchema, IsoDateSchema } from './common.js';

/**
 * Tipo do relato (RF17). Os rotulos que o usuario le estao na interface
 * ("Algo quebrou", "Tenho uma sugestao", "Esta funcionando bem"); aqui ficam so
 * as chaves estaveis que vao para o banco.
 */
export const FeedbackKindSchema = z.enum(['problema', 'sugestao', 'elogio', 'outro'], {
  message: 'Escolha um tipo de relato: problema, sugestão, elogio ou outro.',
});

/** Teto do texto livre: o suficiente para um relato detalhado, longe de abuso. */
export const FEEDBACK_MESSAGE_MIN = 20;
export const FEEDBACK_MESSAGE_MAX = 2000;

/**
 * Contexto tecnico anexado ao relato. Todo campo e opcional: o usuario pode
 * enviar sem nenhum deles (interruptor desligado). A lista e curta de proposito
 * e e mostrada item a item antes do envio — o codigo do circuito nunca entra
 * aqui.
 */
export const FeedbackContextSchema = z.object({
  /** `navigator.userAgent` — navegador e sistema. */
  userAgent: z.string().max(500).optional(),
  /** Dimensoes da janela, no formato `1440x900`. */
  viewport: z
    .string()
    .regex(/^\d{1,5}x\d{1,5}$/, 'Informe a tela no formato 1440x900')
    .optional(),
  /** Projeto aberto no momento do relato. */
  projectId: IdSchema.optional(),
  /** Desfecho da ultima execucao (`SimulationFailure`), ou `sucesso`. */
  lastFailure: z.string().max(40).optional(),
  /** Saida do compilador da ultima execucao — o dado mais util para reproduzir o problema. */
  compilerOutput: z.string().max(4000).optional(),
  /** Identificador anonimo da sessao, gerado no navegador; nao identifica a pessoa. */
  sessionId: z.string().max(64).optional(),
});

/** Corpo de `POST /api/feedback`. */
export const CreateFeedbackSchema = z.object({
  kind: FeedbackKindSchema,
  message: z
    .string()
    .trim()
    .min(FEEDBACK_MESSAGE_MIN, 'Conte um pouco mais: escreva ao menos 20 caracteres.')
    .max(FEEDBACK_MESSAGE_MAX, 'A mensagem excede 2000 caracteres. Resuma o relato.'),
  /** Opcional: so para quem quiser resposta fora da plataforma. */
  contact: z.email('Informe um e-mail válido ou deixe o campo vazio.').trim().max(200).nullish(),
  context: FeedbackContextSchema.nullish(),
});

/** Confirmacao minima do recebimento — nada do que foi gravado volta ao cliente. */
export const FeedbackReceiptSchema = z.object({
  id: IdSchema,
  receivedAt: IsoDateSchema,
});

export type FeedbackKind = z.infer<typeof FeedbackKindSchema>;
export type FeedbackContext = z.infer<typeof FeedbackContextSchema>;
export type CreateFeedback = z.infer<typeof CreateFeedbackSchema>;
export type FeedbackReceipt = z.infer<typeof FeedbackReceiptSchema>;

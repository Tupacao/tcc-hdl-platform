import { HdlSourcesSchema, IsoDateSchema } from '@tplab/shared';
import { z } from 'zod';

/** Formato gravado no `localStorage` para o rascunho local de um projeto (RF07-I03). */
export const ProjectDraftSchema = z.object({
  sources: HdlSourcesSchema,
  savedAt: IsoDateSchema,
});

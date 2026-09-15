import { HdlSourcesSchema, IsoDateSchema } from '@tplab/shared';
import { z } from 'zod';

/**
 * Formato gravado no `localStorage` (RF07-I02). Não é o mesmo contrato de
 * `packages/shared` (falta dono, histórico de execução não existe na API) -
 * mas reaproveita `HdlSourcesSchema` para o par design/testbench, a única
 * parte que de fato coincide.
 */
const LastRunStatusSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('never') }),
  z.object({ kind: z.literal('success'), at: IsoDateSchema }),
  z.object({ kind: z.literal('failure'), at: IsoDateSchema }),
]);

export const LocalProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable(),
  sources: HdlSourcesSchema,
  lastRun: LastRunStatusSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});

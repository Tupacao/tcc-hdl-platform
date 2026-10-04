import { Prisma, type PrismaClient } from '@prisma/client';
import { FeedbackContextSchema, FeedbackKindSchema } from '@tplab/shared';
import type { Feedback, NewFeedback } from '../../../domain/feedback/entities/feedback.js';
import type { FeedbackRepository } from '../../../domain/feedback/repositories/feedback.repository.js';

interface FeedbackRow {
  id: string;
  kind: string;
  message: string;
  contact: string | null;
  context: Prisma.JsonValue;
  userId: string | null;
  ipHash: string | null;
  limitKey: string | null;
  createdAt: Date;
}

/**
 * `kind` e `context` sao String/Json no banco: o Postgres nao valida schema.
 * Na volta, o que nao casar com o contrato atual vira `outro`/`null` em vez de
 * derrubar a gravacao — perder a tipagem de um relato antigo nao pode impedir
 * um novo de entrar.
 */
function toFeedback(row: FeedbackRow): Feedback {
  const kind = FeedbackKindSchema.safeParse(row.kind);
  const context = FeedbackContextSchema.safeParse(row.context);
  return {
    id: row.id,
    kind: kind.success ? kind.data : 'outro',
    message: row.message,
    contact: row.contact,
    context: context.success ? context.data : null,
    userId: row.userId,
    ipHash: row.ipHash,
    limitKey: row.limitKey,
    createdAt: row.createdAt,
  };
}

/** Implementacao sobre PostgreSQL (RF17-I01). */
export class PrismaFeedbackRepository implements FeedbackRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: NewFeedback): Promise<Feedback> {
    const row = await this.prisma.feedback.create({
      data: {
        kind: input.kind,
        message: input.message,
        contact: input.contact,
        context: input.context === null ? Prisma.DbNull : (input.context as Prisma.InputJsonValue),
        userId: input.userId,
        ipHash: input.ipHash,
        limitKey: input.limitKey,
      },
    });
    return toFeedback(row);
  }

  async countSince(limitKey: string, since: Date): Promise<number> {
    return this.prisma.feedback.count({ where: { limitKey, createdAt: { gte: since } } });
  }
}

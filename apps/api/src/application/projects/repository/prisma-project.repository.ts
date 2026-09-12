import { Prisma, type PrismaClient } from '@prisma/client';
import { ProjectSchema, type CreateProject, type Project, type UpdateProject } from '@tplab/shared';
import type { ProjectRepository } from '../../../domain/projects/repositories/project.repository.js';

/** `sources` e Json no banco: nao ha validacao de schema no Postgres. */
class CorruptProjectDataError extends Error {
  constructor(id: string, cause: unknown) {
    super(`Projeto ${id} tem dados incompatíveis com o schema atual`);
    this.name = 'CorruptProjectDataError';
    this.cause = cause;
  }
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  sources: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

function toProject(row: ProjectRow): Project {
  const parsed = ProjectSchema.safeParse({
    id: row.id,
    name: row.name,
    description: row.description,
    sources: row.sources,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

  if (!parsed.success) throw new CorruptProjectDataError(row.id, parsed.error);
  return parsed.data;
}

/** `P2025`: "An operation failed because it depends on one or more records that were required but not found." */
function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

/** Implementacao sobre PostgreSQL (RF07-I01). Mesma semantica de `update` parcial da versao em memoria. */
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
    return rows.map(toProject);
  }

  async findById(id: string): Promise<Project | null> {
    const row = await this.prisma.project.findUnique({ where: { id } });
    return row ? toProject(row) : null;
  }

  async create(input: CreateProject): Promise<Project> {
    const row = await this.prisma.project.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        sources: input.sources as Prisma.InputJsonValue,
      },
    });
    return toProject(row);
  }

  async update(id: string, input: UpdateProject): Promise<Project | null> {
    try {
      const row = await this.prisma.project.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description ?? null } : {}),
          ...(input.sources !== undefined
            ? { sources: input.sources as Prisma.InputJsonValue }
            : {}),
        },
      });
      return toProject(row);
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.project.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) return false;
      throw error;
    }
  }
}

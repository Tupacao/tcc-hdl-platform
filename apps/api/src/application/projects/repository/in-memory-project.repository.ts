import { randomUUID } from 'node:crypto';
import type { CreateProject, Project, UpdateProject } from '@tplab/shared';
import type { ProjectRepository } from '../../../domain/projects/repositories/project.repository.js';

/** Implementacao em memoria — desenvolvimento local e testes, sem Postgres. */
export class InMemoryProjectRepository implements ProjectRepository {
  readonly #projects = new Map<string, Project>();

  async list(): Promise<Project[]> {
    return [...this.#projects.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async findById(id: string): Promise<Project | null> {
    return this.#projects.get(id) ?? null;
  }

  async create(input: CreateProject): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      sources: input.sources,
      createdAt: now,
      updatedAt: now,
    };

    this.#projects.set(project.id, project);
    return project;
  }

  async update(id: string, input: UpdateProject): Promise<Project | null> {
    const current = this.#projects.get(id);
    if (!current) return null;

    const updated: Project = {
      ...current,
      name: input.name ?? current.name,
      description:
        input.description === undefined ? current.description : (input.description ?? null),
      sources: input.sources ?? current.sources,
      updatedAt: new Date().toISOString(),
    };

    this.#projects.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.#projects.delete(id);
  }
}

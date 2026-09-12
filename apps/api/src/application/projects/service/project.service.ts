import type { CreateProject, Project, UpdateProject } from '@tplab/shared';
import type { ProjectRepository } from '../../../domain/projects/repositories/project.repository.js';
import type { ProjectService } from '../../../domain/projects/services/project.service.js';

/**
 * Hoje um repasse direto ao repository — RF07 nao tem regra de negocio alem do
 * CRUD. A camada existe para que o controller nunca acesse o repository
 * diretamente (ver `docs/ARCHITECTURE.md#2-backend`).
 */
export class DefaultProjectService implements ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  list(): Promise<Project[]> {
    return this.repository.list();
  }

  findById(id: string): Promise<Project | null> {
    return this.repository.findById(id);
  }

  create(input: CreateProject): Promise<Project> {
    return this.repository.create(input);
  }

  update(id: string, input: UpdateProject): Promise<Project | null> {
    return this.repository.update(id, input);
  }

  remove(id: string): Promise<boolean> {
    return this.repository.remove(id);
  }
}

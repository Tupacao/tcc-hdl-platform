import type { CreateProject, Project, UpdateProject } from '@tplab/shared';

/**
 * Regra de negocio de projetos (RF07). O controller nunca acessa o repository
 * diretamente — sempre por aqui, mesmo quando a implementacao de hoje e um
 * repasse direto (ver `application/projects/service/project.service.ts`).
 */
export interface ProjectService {
  list(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(input: CreateProject): Promise<Project>;
  update(id: string, input: UpdateProject): Promise<Project | null>;
  remove(id: string): Promise<boolean>;
}

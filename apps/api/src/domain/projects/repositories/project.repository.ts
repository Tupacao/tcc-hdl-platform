import type { CreateProject, Project, UpdateProject } from '@tplab/shared';

/**
 * Contrato de persistencia de projetos (RF07). Implementacoes vivem em
 * `application/projects/repository/` — em memoria para desenvolvimento/teste,
 * Prisma/PostgreSQL para producao (RF07-I01).
 */
export interface ProjectRepository {
  list(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(input: CreateProject): Promise<Project>;
  update(id: string, input: UpdateProject): Promise<Project | null>;
  remove(id: string): Promise<boolean>;
}

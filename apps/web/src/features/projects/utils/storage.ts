import type { LocalProject } from '../models/types';
import { LocalProjectSchema } from './local-project-schema';

/** Unica chave usada no `localStorage` (RF07-I02) — um array serializado. */
export const PROJECTS_STORAGE_KEY = 'tplab:projects';

/**
 * Le e valida os projetos gravados. Um item corrompido ou de um formato antigo
 * e descartado silenciosamente em vez de derrubar a lista inteira - o usuario
 * ve os projetos validos, nao uma tela de erro por causa de um registro ruim.
 */
export function readProjects(storage: Pick<Storage, 'getItem'>): LocalProject[] {
  const raw = storage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const projects: LocalProject[] = [];
  for (const item of parsed) {
    const result = LocalProjectSchema.safeParse(item);
    if (result.success) projects.push(result.data);
  }
  return projects;
}

export class ProjectStorageWriteError extends Error {
  constructor(cause: unknown) {
    super('Nao foi possivel salvar no armazenamento deste navegador.');
    this.name = 'ProjectStorageWriteError';
    this.cause = cause;
  }
}

/** Lanca `ProjectStorageWriteError` se o navegador recusar a escrita (quota, modo privado, etc). */
export function writeProjects(storage: Pick<Storage, 'setItem'>, projects: LocalProject[]): void {
  try {
    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (cause) {
    throw new ProjectStorageWriteError(cause);
  }
}

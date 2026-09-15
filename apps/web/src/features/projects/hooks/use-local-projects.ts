import { useCallback, useMemo, useState } from 'react';
import type { HdlSources } from '@tplab/shared';
import type { CreateLocalProjectInput, LastRunStatus, LocalProject } from '../models/types';
import { STORAGE_ERROR } from '../utils/messages';
import { readProjects, writeProjects } from '../utils/storage';
import { buildCopyName } from '../utils/validation';

/** `getItem` pode lançar em navegadores que bloqueiam o `localStorage` (modo privado antigo, cookies desabilitados). */
function readProjectsSafely(): { projects: LocalProject[]; error: string | null } {
  try {
    return { projects: readProjects(window.localStorage), error: null };
  } catch {
    return { projects: [], error: STORAGE_ERROR.LOAD_BODY };
  }
}

export interface UseLocalProjectsResult {
  /** Ordenados por `updatedAt` decrescente (mais recente primeiro). */
  projects: LocalProject[];
  /** Falha ao LER o localStorage no mount (raro: navegador bloqueando o acesso). */
  loadError: string | null;
  retryLoad(): void;
  getById(id: string): LocalProject | undefined;
  create(input: CreateLocalProjectInput): LocalProject;
  rename(id: string, name: string): void;
  duplicate(id: string): LocalProject;
  /** RF07-I03 - grava o código editado no workspace, atualizando `updatedAt`. */
  save(id: string, sources: HdlSources): LocalProject;
  /** RF07-I03 - resultado da última execução a partir do workspace; não mexe em `updatedAt`. */
  recordRun(id: string, status: LastRunStatus): void;
  /** Devolve o projeto removido (para o toast com "Desfazer"), ou null se o id não existir. */
  remove(id: string): LocalProject | null;
  /** Reinsere um projeto removido (ação "Desfazer" do toast de exclusão). */
  restore(project: LocalProject): void;
}

/**
 * Exceção deliberada e documentada à regra de `hooks/` (ARCHITECTURE.md:
 * "exclusivamente hooks de integração com API") - mesmo critério já aplicado a
 * `use-viewport.ts`/`use-parsed-vcd.ts` da feature waveform: é um hook de
 * verdade (estado React + persistência como efeito colateral), só que a
 * "API" aqui é o `localStorage` do navegador (RF07-I02), não HTTP. Enquanto
 * RF14 não existe, nenhum projeto é enviado à API real (RF07-I01) - ver nota
 * de implementação no issue doc.
 */
export function useLocalProjects(): UseLocalProjectsResult {
  const [{ projects, loadError }, setState] = useState(() => {
    const result = readProjectsSafely();
    return { projects: result.projects, loadError: result.error };
  });

  const retryLoad = useCallback(() => {
    const result = readProjectsSafely();
    setState({ projects: result.projects, loadError: result.error });
  }, []);

  const persist = useCallback((next: LocalProject[]) => {
    writeProjects(window.localStorage, next);
    setState({ projects: next, loadError: null });
  }, []);

  const getById = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  const create = useCallback(
    (input: CreateLocalProjectInput): LocalProject => {
      const now = new Date().toISOString();
      const project: LocalProject = {
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description ?? null,
        sources: input.sources,
        lastRun: { kind: 'never' },
        createdAt: now,
        updatedAt: now,
      };
      persist([project, ...projects]);
      return project;
    },
    [persist, projects],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const next = projects.map((project) =>
        project.id === id ? { ...project, name, updatedAt: new Date().toISOString() } : project,
      );
      persist(next);
    },
    [persist, projects],
  );

  const save = useCallback(
    (id: string, sources: HdlSources): LocalProject => {
      const now = new Date().toISOString();
      let saved: LocalProject | undefined;
      const next = projects.map((project) => {
        if (project.id !== id) return project;
        saved = { ...project, sources, updatedAt: now };
        return saved;
      });
      if (!saved) throw new Error(`Projeto ${id} não encontrado para salvar`);
      persist(next);
      return saved;
    },
    [persist, projects],
  );

  const recordRun = useCallback(
    (id: string, status: LastRunStatus) => {
      const next = projects.map((project) =>
        project.id === id ? { ...project, lastRun: status } : project,
      );
      persist(next);
    },
    [persist, projects],
  );

  const duplicate = useCallback(
    (id: string): LocalProject => {
      const source = projects.find((project) => project.id === id);
      if (!source) throw new Error(`Projeto ${id} não encontrado para duplicar`);

      const name = buildCopyName(
        source.name,
        projects.map((p) => p.name),
      );

      const now = new Date().toISOString();
      const copy: LocalProject = {
        ...source,
        id: crypto.randomUUID(),
        name,
        lastRun: { kind: 'never' },
        createdAt: now,
        updatedAt: now,
      };
      persist([copy, ...projects]);
      return copy;
    },
    [persist, projects],
  );

  const remove = useCallback(
    (id: string): LocalProject | null => {
      const project = projects.find((p) => p.id === id);
      if (!project) return null;
      persist(projects.filter((p) => p.id !== id));
      return project;
    },
    [persist, projects],
  );

  const restore = useCallback(
    (project: LocalProject) => {
      if (projects.some((p) => p.id === project.id)) return;
      persist([project, ...projects]);
    },
    [persist, projects],
  );

  const sorted = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [projects],
  );

  return {
    projects: sorted,
    loadError,
    retryLoad,
    getById,
    create,
    rename,
    duplicate,
    save,
    recordRun,
    remove,
    restore,
  };
}

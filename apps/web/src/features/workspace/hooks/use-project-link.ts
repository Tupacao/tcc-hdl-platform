import { useCallback, useEffect, useState } from 'react';
import type { HdlSources } from '@tplab/shared';
import {
  clearDraft,
  readDraft,
  writeDraft,
  type LocalProject,
  type ProjectDraft,
} from '@/features/projects';
import { SAMPLE_SOURCES } from '@/lib/samples';
import { sourcesEqual } from '../utils/sources-equal';

const DRAFT_DEBOUNCE_MS = 800;

export type WorkspaceFile = 'design' | 'testbench';

export interface UseProjectLinkResult {
  sources: HdlSources;
  updateFile: (file: WorkspaceFile, content: string) => void;
  /** `false` sem projeto aberto - o rascunho anônimo (RF20) nunca "salva" nem avisa. */
  isDirty: boolean;
  save: () => void;
  /** Rascunho local mais novo que a última versão salva, encontrado ao abrir o projeto. */
  pendingDraft: ProjectDraft | null;
  useDraft: () => void;
  discardDraft: () => void;
}

/**
 * RF07-I03 - liga o `Workspace` ao projeto aberto: estado de alterações não
 * salvas (por comparação, nunca um booleano solto), rascunho local com
 * debounce, atalho de salvar e aviso do navegador antes de fechar/recarregar.
 *
 * Exceção deliberada à regra de `hooks/` (ARCHITECTURE.md), mesmo critério já
 * usado em `useLocalProjects`: é um hook de verdade (estado + efeito
 * colateral), só que a "API" é o `localStorage`, não HTTP - RF07-I02 decidiu
 * manter os projetos locais até RF14 (login) existir, então não há PATCH de
 * servidor para salvar aqui.
 *
 * Montado uma vez por projeto aberto: `Workspace` é remontado com `key`
 * diferente a cada troca de projeto (App.tsx), então o estado inicial abaixo
 * nunca precisa reagir a mudança de `project` depois do mount.
 */
export function useProjectLink(
  project: LocalProject | null,
  onSave: (id: string, sources: HdlSources) => void,
  /**
   * Substitui a fonte inicial do editor, tanto no rascunho anônimo (RF20 por
   * padrão) quanto - a diferença de antes - também com um projeto aberto
   * (RF11: "Substituir o conteúdo atual" ao abrir um exemplo da
   * documentação). Por isso `savedSources` abaixo NUNCA usa este valor: um
   * override com projeto aberto precisa nascer "não salvo" (comparado contra
   * a versão real salva), nunca aparecer como se já estivesse persistido.
   */
  overrideSources?: HdlSources,
): UseProjectLinkResult {
  const [sources, setSources] = useState<HdlSources>(
    overrideSources ?? project?.sources ?? SAMPLE_SOURCES,
  );
  const [savedSources, setSavedSources] = useState<HdlSources>(project?.sources ?? SAMPLE_SOURCES);
  const [pendingDraft, setPendingDraft] = useState<ProjectDraft | null>(null);

  // Ao abrir um projeto com rascunho mais novo que a última versão salva,
  // pergunta antes de aplicar - nunca sobrescreve em silêncio. Um rascunho
  // mais antigo (sobrou de um `save()` que não chegou a limpar o rascunho) é
  // apenas descartado. Pulado quando há `overrideSources`: a pessoa acabou de
  // escolher explicitamente o que quer no editor, perguntar sobre um
  // rascunho antigo por cima seria um segundo diálogo competindo pela mesma
  // decisão.
  useEffect(() => {
    if (!project || overrideSources) return;
    const draft = readDraft(window.localStorage, project.id);
    if (!draft) return;
    if (draft.savedAt > project.updatedAt) setPendingDraft(draft);
    else clearDraft(window.localStorage, project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFile = useCallback((file: WorkspaceFile, content: string) => {
    setSources((current) => ({ ...current, [file]: { ...current[file], content } }));
  }, []);

  const isDirty = project !== null && !sourcesEqual(sources, savedSources);

  // Rascunho local com debounce - cobre fechar a aba por acidente sem gravar
  // no projeto "oficial" a cada tecla digitada.
  useEffect(() => {
    if (!project || !isDirty) return;
    const timer = window.setTimeout(() => {
      writeDraft(window.localStorage, project.id, { sources, savedAt: new Date().toISOString() });
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [project, isDirty, sources]);

  // Aviso nativo do navegador ao fechar a aba ou recarregar com pendências.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const save = useCallback(() => {
    if (!project) return;
    onSave(project.id, sources);
    setSavedSources(sources);
    clearDraft(window.localStorage, project.id);
  }, [project, sources, onSave]);

  // Ctrl+S / Cmd+S salva sem submeter nada nem abrir o diálogo "Salvar página"
  // do navegador - vale mesmo sem projeto aberto, só para o `preventDefault`.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  const useDraft = useCallback(() => {
    if (!pendingDraft) return;
    setSources(pendingDraft.sources);
    setPendingDraft(null);
  }, [pendingDraft]);

  const discardDraft = useCallback(() => {
    if (project) clearDraft(window.localStorage, project.id);
    setPendingDraft(null);
  }, [project]);

  return { sources, updateFile, isDirty, save, pendingDraft, useDraft, discardDraft };
}

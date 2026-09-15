import type { ProjectDraft } from '../models/types';
import { ProjectDraftSchema } from './project-draft-schema';

function draftKey(projectId: string): string {
  return `tplab:draft:${projectId}`;
}

/**
 * Lê o rascunho local de um projeto (RF07-I03). Ao contrário de
 * `readProjects`/`writeProjects` (ação explícita do usuário, erro visível via
 * toast), o rascunho é um efeito colateral de fundo - qualquer falha (bloqueio
 * de `localStorage`, quota, JSON inválido) só degrada para "sem rascunho",
 * nunca interrompe o fluxo de edição.
 */
export function readDraft(
  storage: Pick<Storage, 'getItem'>,
  projectId: string,
): ProjectDraft | null {
  try {
    const raw = storage.getItem(draftKey(projectId));
    if (!raw) return null;

    const result = ProjectDraftSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function writeDraft(
  storage: Pick<Storage, 'setItem'>,
  projectId: string,
  draft: ProjectDraft,
): void {
  try {
    storage.setItem(draftKey(projectId), JSON.stringify(draft));
  } catch {
    // Degrada sem rascunho (modo privativo, quota) - nunca quebra a edição.
  }
}

export function clearDraft(storage: Pick<Storage, 'removeItem'>, projectId: string): void {
  try {
    storage.removeItem(draftKey(projectId));
  } catch {
    // Mesmo critério de writeDraft: falha aqui não pode quebrar o fluxo.
  }
}

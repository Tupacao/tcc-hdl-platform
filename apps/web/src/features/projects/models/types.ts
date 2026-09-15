import type { HdlSources } from '@tplab/shared';

/**
 * Resultado da última execução do projeto (RF07-I02). Só `success`/`failure`
 * têm carimbo de tempo; sem execução ainda o card mostra "nunca executado".
 * Não há escrita para este campo até RF07-I03 (vínculo com o workspace) rodar
 * a simulação a partir de um projeto aberto - todo projeto novo nasce `never`.
 */
export type LastRunStatus =
  { kind: 'never' } | { kind: 'success'; at: string } | { kind: 'failure'; at: string };

/**
 * Projeto salvo no navegador (RF07-I02/RF14). `sources` reaproveita o mesmo
 * formato de `packages/shared` (HdlSources) usado pelo workspace e pela API -
 * quando RF14 existir, este mesmo objeto vira o corpo de `POST /api/projects`.
 */
export interface LocalProject {
  id: string;
  name: string;
  description: string | null;
  sources: HdlSources;
  lastRun: LastRunStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocalProjectInput {
  name: string;
  description?: string | null;
  sources: HdlSources;
}

export interface UpdateLocalProjectInput {
  name?: string;
  description?: string | null;
  sources?: HdlSources;
}

/**
 * Rascunho local do workspace (RF07-I03), gravado com debounce à parte do
 * próprio `LocalProject.sources` - só a ação "Salvar" atualiza o projeto de
 * verdade. `savedAt` é o que decide, na abertura, se o rascunho é mais novo
 * que a última versão salva do projeto.
 */
export interface ProjectDraft {
  sources: HdlSources;
  savedAt: string;
}

import type { HdlSources } from '@tplab/shared';

/**
 * Resultado da ultima execucao do projeto (RF07-I02). So `success`/`failure`
 * teem carimbo de tempo; sem execucao ainda o card mostra "nunca executado".
 * Nao ha escrita para este campo ate RF07-I03 (vinculo com o workspace) rodar
 * a simulacao a partir de um projeto aberto - todo projeto novo nasce `never`.
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

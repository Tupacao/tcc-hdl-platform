import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import type { HdlSources } from '@tplab/shared';
import { ThemeProvider } from '@/components/theme-provider';
import { Workspace } from '@/features/workspace/workspace';
import { ProjectsPage, useLocalProjects, type LocalProject } from '@/features/projects';
import { queryClient } from '@/lib/query-client';

type View = 'workspace' | 'projects';

/**
 * So o id, nao a `view` - recarregar sempre volta para o workspace (RF07-I03:
 * "recarregar oferece o rascunho local" pressupoe estar de volta no editor,
 * nao na lista). Falha de leitura/escrita (modo privativo) so degrada para
 * "sem projeto lembrado", mesmo criterio do `ThemeProvider`.
 */
const LAST_OPEN_PROJECT_KEY = 'tplab:last-open-project';

function readLastOpenProjectId(): string | null {
  try {
    return window.localStorage.getItem(LAST_OPEN_PROJECT_KEY);
  } catch {
    return null;
  }
}

function writeLastOpenProjectId(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(LAST_OPEN_PROJECT_KEY, id);
    else window.localStorage.removeItem(LAST_OPEN_PROJECT_KEY);
  } catch {
    // Degrada sem lembrar o projeto entre recarregamentos - nunca quebra a navegacao.
  }
}

export default function App() {
  const localProjects = useLocalProjects();
  const [view, setView] = useState<View>('workspace');
  const [openProjectId, setOpenProjectId] = useState<string | null>(readLastOpenProjectId);
  // Busca de novo a cada render (em vez de guardar o `LocalProject` inteiro) -
  // assim o Workspace sempre ve a versao mais recente apos salvar/renomear em
  // outra tela, sem precisar sincronizar duas copias do mesmo projeto (RF07-I03).
  const openProject = openProjectId ? (localProjects.getById(openProjectId) ?? null) : null;

  // Fontes de um exemplo da documentacao (RF11), carregadas no rascunho
  // anonimo. `exampleVersion` forca o Workspace a remontar mesmo quando dois
  // exemplos diferentes sao abertos em sequencia sem sair do modo anonimo -
  // sem isso o `key` ficaria igual e o segundo exemplo nunca apareceria.
  const [exampleSources, setExampleSources] = useState<HdlSources | undefined>(undefined);
  const [exampleVersion, setExampleVersion] = useState(0);

  // Projeto lembrado de uma sessao anterior que nao existe mais (excluido em
  // outra aba, por exemplo) - limpa a lembranca em vez de insistir nele.
  useEffect(() => {
    if (openProjectId && !localProjects.loadError && !openProject) {
      setOpenProjectId(null);
      writeLastOpenProjectId(null);
    }
  }, [openProjectId, openProject, localProjects.loadError]);

  function handleOpenProject(project: LocalProject) {
    setOpenProjectId(project.id);
    writeLastOpenProjectId(project.id);
    setView('workspace');
  }

  function handleOpenExample(sources: HdlSources) {
    setOpenProjectId(null);
    writeLastOpenProjectId(null);
    setExampleSources(sources);
    setExampleVersion((version) => version + 1);
    setView('workspace');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {view === 'projects' ? (
          <ProjectsPage
            localProjects={localProjects}
            onOpenProject={handleOpenProject}
            onNavigateBack={() => setView('workspace')}
            onOpenExample={handleOpenExample}
          />
        ) : (
          <Workspace
            key={openProject?.id ?? `anonymous-${exampleVersion}`}
            project={openProject}
            initialSources={openProject ? undefined : exampleSources}
            onSaveProject={localProjects.save}
            onRecordRun={localProjects.recordRun}
            onOpenProjects={() => setView('projects')}
            onOpenExample={handleOpenExample}
          />
        )}
        <Toaster position="bottom-right" closeButton />
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

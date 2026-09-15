import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import type { HdlSources } from '@tplab/shared';
import { ThemeProvider } from '@/components/theme-provider';
import { Workspace } from '@/features/workspace/workspace';
import { OpenExampleDialog } from '@/features/workspace/components/open-example-dialog';
import { ProjectsPage, useLocalProjects, type LocalProject } from '@/features/projects';
import { DocsPage } from '@/features/docs';
import { HomePage } from '@/features/home';
import { queryClient } from '@/lib/query-client';

type View = 'home' | 'workspace' | 'projects' | 'docs';

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
  // RF01 (Figma "0 · Home") - a home e a primeira tela, material de
  // marketing complementar; "Comecar a programar"/"Abrir o editor" levam ao
  // workspace de verdade sem exigir nada antes.
  const [view, setView] = useState<View>('home');
  const [docsInitialSectionId, setDocsInitialSectionId] = useState<string | undefined>(undefined);
  const [openProjectId, setOpenProjectId] = useState<string | null>(readLastOpenProjectId);
  // Busca de novo a cada render (em vez de guardar o `LocalProject` inteiro) -
  // assim o Workspace sempre ve a versao mais recente apos salvar/renomear em
  // outra tela, sem precisar sincronizar duas copias do mesmo projeto (RF07-I03).
  const openProject = openProjectId ? (localProjects.getById(openProjectId) ?? null) : null;

  // Fontes de um exemplo da documentacao (RF11), aplicadas por cima do
  // rascunho anonimo OU do projeto aberto (Figma "Onde abrir": "Substituir o
  // conteudo atual" mantem o projeto aberto, so troca as fontes ao vivo).
  // `workspaceVersion` forca o Workspace a remontar mesmo quando o `key`
  // baseado no projeto nao muda (dois exemplos seguidos no anonimo, ou
  // substituir o conteudo do mesmo projeto) - sem isso o segundo exemplo
  // nunca apareceria.
  const [overrideSources, setOverrideSources] = useState<HdlSources | undefined>(undefined);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  // Exemplo escolhido na documentacao aguardando a escolha "Onde abrir" -
  // so existe quando ha projeto aberto (ver handleOpenExample).
  const [pendingExample, setPendingExample] = useState<HdlSources | null>(null);

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
    setOverrideSources(undefined);
    setView('workspace');
  }

  function openExampleAsNew(sources: HdlSources) {
    setOpenProjectId(null);
    writeLastOpenProjectId(null);
    setOverrideSources(sources);
    setWorkspaceVersion((version) => version + 1);
    setView('workspace');
  }

  function openExampleReplacingCurrent(sources: HdlSources) {
    setOverrideSources(sources);
    setWorkspaceVersion((version) => version + 1);
    setView('workspace');
  }

  /** RF11 - "Abrir no editor" na documentacao. Sem projeto aberto, nao ha o que perguntar. */
  function handleOpenExample(sources: HdlSources) {
    if (openProject) setPendingExample(sources);
    else openExampleAsNew(sources);
  }

  function handleConfirmOpenExample(mode: 'new' | 'replace') {
    if (!pendingExample) return;
    if (mode === 'new') openExampleAsNew(pendingExample);
    else openExampleReplacingCurrent(pendingExample);
    setPendingExample(null);
  }

  function handleOpenDocs(sectionId?: string) {
    setDocsInitialSectionId(sectionId);
    setView('docs');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {view === 'home' && (
          <HomePage
            projects={localProjects.projects}
            onOpenWorkspace={() => setView('workspace')}
            onOpenProject={handleOpenProject}
            onOpenProjects={() => setView('projects')}
            onOpenDocs={handleOpenDocs}
          />
        )}
        {view === 'projects' && (
          <ProjectsPage
            localProjects={localProjects}
            onOpenProject={handleOpenProject}
            onNavigateBack={() => setView('workspace')}
            onOpenDocs={() => handleOpenDocs()}
          />
        )}
        {view === 'docs' && (
          <DocsPage
            onNavigateBack={() => setView('workspace')}
            onOpenInEditor={handleOpenExample}
            initialSectionId={docsInitialSectionId}
          />
        )}
        {view === 'workspace' && (
          <Workspace
            key={openProject?.id ?? `anonymous-${workspaceVersion}`}
            project={openProject}
            overrideSources={overrideSources}
            onSaveProject={localProjects.save}
            onRecordRun={localProjects.recordRun}
            onOpenProjects={() => setView('projects')}
            onOpenDocs={() => handleOpenDocs()}
          />
        )}

        <OpenExampleDialog
          projectName={pendingExample ? (openProject?.name ?? null) : null}
          onOpenChange={(open) => !open && setPendingExample(null)}
          onConfirm={handleConfirmOpenExample}
        />

        <Toaster position="bottom-right" closeButton />
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

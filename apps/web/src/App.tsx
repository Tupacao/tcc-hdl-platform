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
import { queryClient } from '@/lib/query-client';

type View = 'workspace' | 'projects' | 'docs';

/**
 * Só o id, não a `view` - recarregar sempre volta para o workspace (RF07-I03:
 * "recarregar oferece o rascunho local" pressupõe estar de volta no editor,
 * não na lista). Falha de leitura/escrita (modo privativo) só degrada para
 * "sem projeto lembrado", mesmo critério do `ThemeProvider`.
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
    // Degrada sem lembrar o projeto entre recarregamentos - nunca quebra a navegação.
  }
}

export default function App() {
  const localProjects = useLocalProjects();
  const [view, setView] = useState<View>('workspace');
  const [openProjectId, setOpenProjectId] = useState<string | null>(readLastOpenProjectId);
  // Busca de novo a cada render (em vez de guardar o `LocalProject` inteiro) -
  // assim o Workspace sempre vê a versão mais recente após salvar/renomear em
  // outra tela, sem precisar sincronizar duas cópias do mesmo projeto (RF07-I03).
  const openProject = openProjectId ? (localProjects.getById(openProjectId) ?? null) : null;

  // Fontes de um exemplo da documentação (RF11), aplicadas por cima do
  // rascunho anônimo OU do projeto aberto (Figma "Onde abrir": "Substituir o
  // conteúdo atual" mantém o projeto aberto, só troca as fontes ao vivo).
  // `workspaceVersion` força o Workspace a remontar mesmo quando o `key`
  // baseado no projeto não muda (dois exemplos seguidos no anônimo, ou
  // substituir o conteúdo do mesmo projeto) - sem isso o segundo exemplo
  // nunca apareceria.
  const [overrideSources, setOverrideSources] = useState<HdlSources | undefined>(undefined);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  // Exemplo escolhido na documentação aguardando a escolha "Onde abrir" -
  // só existe quando há projeto aberto (ver handleOpenExample).
  const [pendingExample, setPendingExample] = useState<HdlSources | null>(null);

  // Projeto lembrado de uma sessão anterior que não existe mais (excluído em
  // outra aba, por exemplo) - limpa a lembrança em vez de insistir nele.
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

  /** RF11 - "Abrir no editor" na documentação. Sem projeto aberto, não há o que perguntar. */
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {view === 'projects' && (
          <ProjectsPage
            localProjects={localProjects}
            onOpenProject={handleOpenProject}
            onNavigateBack={() => setView('workspace')}
            onOpenDocs={() => setView('docs')}
          />
        )}
        {view === 'docs' && (
          <DocsPage
            onNavigateBack={() => setView('workspace')}
            onOpenInEditor={handleOpenExample}
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
            onOpenDocs={() => setView('docs')}
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

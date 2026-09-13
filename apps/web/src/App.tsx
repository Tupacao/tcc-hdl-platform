import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Workspace } from '@/features/workspace/workspace';
import { ProjectsPage, type LocalProject } from '@/features/projects';
import { queryClient } from '@/lib/query-client';

type View = 'workspace' | 'projects';

export default function App() {
  const [view, setView] = useState<View>('workspace');
  // RF07-I02 abre com as fontes do projeto escolhido; a "sincronia" continua
  // (auto-salvar, aviso de alteracoes nao salvas) e trabalho de RF07-I03.
  const [openProject, setOpenProject] = useState<LocalProject | null>(null);

  function handleOpenProject(project: LocalProject) {
    setOpenProject(project);
    setView('workspace');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {view === 'projects' ? (
          <ProjectsPage
            onOpenProject={handleOpenProject}
            onNavigateBack={() => setView('workspace')}
          />
        ) : (
          <Workspace
            key={openProject?.id ?? 'default'}
            initialSources={openProject?.sources}
            onOpenProjects={() => setView('projects')}
          />
        )}
        <Toaster position="bottom-right" closeButton />
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

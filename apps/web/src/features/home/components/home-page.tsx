import { Check, CircleAlert, CircleDashed, CircuitBoard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { formatRelativeTime, type LocalProject } from '@/features/projects';
import {
  BADGE_TEXT,
  CTA_OPEN_SAMPLE,
  CTA_START_CODING,
  DISCLAIMER,
  FEATURE_CARDS,
  FEATURES_TITLE,
  FOOTER_TAGLINE,
  formatEditedAt,
  formatViewAllProjects,
  HEADLINE,
  HOW_IT_WORKS_STEPS,
  HOW_IT_WORKS_SUBTITLE,
  HOW_IT_WORKS_TITLE,
  NAV_DOCS_LABEL,
  NAV_OPEN_EDITOR_LABEL,
  POSITIONING,
  RESUME_CARD,
  RESUME_STATUS_LABELS,
  START_NEW_PROJECT,
  SUBHEADLINE,
} from '../utils/messages';

interface HomePageProps {
  /** Ordenados por `updatedAt` decrescente (RF07-I02) - `projects[0]` e o mais recente. */
  projects: LocalProject[];
  onOpenWorkspace: () => void;
  onOpenProject: (project: LocalProject) => void;
  onOpenProjects: () => void;
  onOpenDocs: (sectionId?: string) => void;
}

/**
 * RF01 (Figma "0 · Home") - pagina de apresentacao do TP Lab, material de
 * marketing complementar (nao faz parte da cobertura funcional de RF01, que
 * esta nos frames de primeiro acesso/carregamento/servidor indisponivel -
 * ver `docs/requisitos/funcional/RF01/figma/WILL-BE-DONE.md`). E a primeira
 * tela ao abrir a aplicacao; "Comecar a programar"/"Abrir o editor" levam ao
 * workspace de verdade, sem barreira.
 *
 * Divergencias deliberadas do mockup: sem o mockup estatico do produto (o
 * produto de verdade fica a um clique, uma imitacao arrisca ficar
 * desatualizada); sem o controle de tema de tres modos (RF10-I01 ainda nao
 * existe - reusa o `ThemeToggle` de dois modos ja usado no resto do app);
 * sem links para "Exemplos"/"Sobre o projeto"/"Enviar feedback" no menu e no
 * rodape (nenhuma dessas paginas existe - RF20-I02 e RF17 nao implementados).
 * O card "Erros que explicam" do Figma promete traducao em portugues e link
 * para a documentacao (RF05-I03, adiado) - reescrito aqui para descrever so
 * o que RF05-I01/I02 realmente entregam hoje: arquivo e linha exata.
 */
export function HomePage({
  projects,
  onOpenWorkspace,
  onOpenProject,
  onOpenProjects,
  onOpenDocs,
}: HomePageProps) {
  const mostRecent = projects[0] ?? null;

  return (
    <div className="min-w-[1024px] overflow-y-auto">
      <header className="flex items-center gap-3 border-b px-6 py-3">
        <CircuitBoard aria-hidden className="size-6" />
        <span className="text-base font-semibold">TP Lab</span>
        <nav className="ml-8 flex items-center gap-6 text-sm text-muted-foreground">
          <button type="button" onClick={() => onOpenDocs()} className="hover:text-foreground">
            {NAV_DOCS_LABEL}
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Button size="sm" onClick={onOpenWorkspace}>
            {NAV_OPEN_EDITOR_LABEL}
          </Button>
        </div>
      </header>

      <section className="flex flex-col items-center gap-6 px-6 py-20 text-center">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          {BADGE_TEXT}
        </span>
        <h1 className="max-w-3xl text-4xl font-bold text-balance">{HEADLINE}</h1>
        <p className="max-w-2xl text-muted-foreground">{SUBHEADLINE}</p>

        {mostRecent ? (
          <ResumeCard
            project={mostRecent}
            projectCount={projects.length}
            onOpenProject={onOpenProject}
            onOpenProjects={onOpenProjects}
          />
        ) : (
          <div className="flex gap-3">
            <Button size="lg" onClick={onOpenWorkspace}>
              {CTA_START_CODING}
            </Button>
            <Button size="lg" variant="outline" onClick={onOpenWorkspace}>
              {CTA_OPEN_SAMPLE}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
      </section>

      <section className="border-t px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold">{FEATURES_TITLE}</h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((card) => (
            <div key={card.title} className="rounded-lg border bg-card p-5">
              <h3 className="mb-2 text-sm font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">{HOW_IT_WORKS_TITLE}</h2>
        <p className="mt-2 text-muted-foreground">{HOW_IT_WORKS_SUBTITLE}</p>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.number}>
              <span className="text-3xl font-bold text-muted-foreground/40">{step.number}</span>
              <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t px-6 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 rounded-lg border bg-muted/30 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{POSITIONING.TITLE}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{POSITIONING.BODY}</p>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => onOpenDocs('o-que-nao-faz')}
          >
            {POSITIONING.CTA} →
          </Button>
        </div>
      </section>

      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <CircuitBoard aria-hidden className="size-4" />
            <span className="text-sm font-medium">TP Lab</span>
          </div>
          <p className="text-xs text-muted-foreground">{FOOTER_TAGLINE}</p>
          <button
            type="button"
            onClick={() => onOpenDocs()}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {NAV_DOCS_LABEL}
          </button>
        </div>
      </footer>
    </div>
  );
}

function ResumeCard({
  project,
  projectCount,
  onOpenProject,
  onOpenProjects,
}: {
  project: LocalProject;
  projectCount: number;
  onOpenProject: (project: LocalProject) => void;
  onOpenProjects: () => void;
}) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <div className="flex w-full items-center gap-4 rounded-lg border bg-card p-5 text-left">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{RESUME_CARD.EYEBROW}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="truncate font-mono text-sm font-medium">{project.name}.v</span>
            <StatusBadge project={project} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatEditedAt(formatRelativeTime(project.updatedAt))}
          </p>
        </div>
        <Button onClick={() => onOpenProject(project)}>{RESUME_CARD.OPEN}</Button>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <button type="button" onClick={onOpenProjects} className="hover:text-foreground">
          {formatViewAllProjects(projectCount)}
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={onOpenProjects} className="hover:text-foreground">
          {START_NEW_PROJECT}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ project }: { project: LocalProject }) {
  if (project.lastRun.kind === 'success') {
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <Check aria-hidden className="size-3" />
        {RESUME_STATUS_LABELS.success}
      </span>
    );
  }
  if (project.lastRun.kind === 'failure') {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <CircleAlert aria-hidden className="size-3" />
        {RESUME_STATUS_LABELS.failure}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <CircleDashed aria-hidden className="size-3" />
      {RESUME_STATUS_LABELS.never}
    </span>
  );
}

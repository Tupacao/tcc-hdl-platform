import { CircleAlert, CircleCheck, CircleDashed } from 'lucide-react';
import type { LocalProject } from '../models/types';
import { formatRelativeTime } from '../utils/format';
import { formatOpenProjectLabel, STATUS_LABELS } from '../utils/messages';
import { ProjectActionsMenu } from './project-actions-menu';

interface ProjectCardProps {
  project: LocalProject;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMenuTriggerFocusable?: (trigger: HTMLButtonElement) => void;
}

/**
 * Um cartao da grade "Meus projetos" (RF07-I02, frame 6.1 do Figma). O nome e
 * um `<button>` de verdade (nao o cartao inteiro) - um `role="button"` com o
 * menu "..." aninhado dentro seria um controle interativo dentro de outro,
 * confuso para leitor de tela. O clique em qualquer parte do cartao ainda
 * abre (conveniencia do mouse via `onClick` no `div`, sem semantica ARIA).
 */
export function ProjectCard({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onMenuTriggerFocusable,
}: ProjectCardProps) {
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          aria-label={formatOpenProjectLabel(project.name)}
          className="truncate rounded font-mono text-sm font-medium text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {project.name}.v
        </button>
        <ProjectActionsMenu
          onOpen={onOpen}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onTriggerFocusable={onMenuTriggerFocusable}
        />
      </div>

      <p className="line-clamp-2 min-h-8 flex-1 text-xs text-muted-foreground">
        {project.description}
      </p>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <StatusIndicator project={project} />
        <span className="shrink-0 text-muted-foreground">
          {formatRelativeTime(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function StatusIndicator({ project }: { project: LocalProject }) {
  if (project.lastRun.kind === 'success') {
    return (
      <span className="flex items-center gap-1 text-success">
        <CircleCheck aria-hidden className="size-3.5" />
        {STATUS_LABELS.SUCCESS}
      </span>
    );
  }
  if (project.lastRun.kind === 'failure') {
    return (
      <span className="flex items-center gap-1 text-destructive">
        <CircleAlert aria-hidden className="size-3.5" />
        {STATUS_LABELS.FAILURE}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <CircleDashed aria-hidden className="size-3.5" />
      {STATUS_LABELS.NEVER_RUN}
    </span>
  );
}

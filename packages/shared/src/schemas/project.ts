import { z } from 'zod';
import { HdlSourcesSchema } from './hdl.js';
import { IdSchema, IsoDateSchema } from './common.js';

/** Projeto persistido — CRUD do RF07. */
export const ProjectSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable(),
  sources: HdlSourcesSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullish(),
  sources: HdlSourcesSchema,
});

/** PATCH parcial: renomear, editar descricao ou salvar novo conteudo. */
export const UpdateProjectSchema = CreateProjectSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Informe ao menos um campo para atualizar' },
);

export const ProjectListSchema = z.object({
  items: z.array(ProjectSchema),
  total: z.number().int().nonnegative(),
});

export const ProjectIdParamsSchema = z.object({ id: IdSchema });

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type ProjectList = z.infer<typeof ProjectListSchema>;

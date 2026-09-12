import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  ApiErrorSchema,
  CreateProjectSchema,
  ProjectIdParamsSchema,
  ProjectListSchema,
  ProjectSchema,
  UpdateProjectSchema,
} from '@tplab/shared';
import type { ProjectService } from '../../../domain/projects/services/project.service.js';
import { InMemoryProjectRepository } from '../repository/in-memory-project.repository.js';
import { DefaultProjectService } from '../service/project.service.js';

const notFound = {
  statusCode: 404,
  error: 'Not Found',
  message: 'Projeto nao encontrado',
} as const;

/** CRUD de projetos (RF07). Entrada HTTP; toda regra passa pelo `ProjectService`. */
export async function projectRoutes(
  app: FastifyInstance,
  options: { service?: ProjectService } = {},
): Promise<void> {
  const service = options.service ?? new DefaultProjectService(new InMemoryProjectRepository());
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/projects',
    { schema: { tags: ['projects'], response: { 200: ProjectListSchema } } },
    async () => {
      const items = await service.list();
      return { items, total: items.length };
    },
  );

  typed.get(
    '/projects/:id',
    {
      schema: {
        tags: ['projects'],
        params: ProjectIdParamsSchema,
        response: { 200: ProjectSchema, 404: ApiErrorSchema },
      },
    },
    async (request, reply) => {
      const project = await service.findById(request.params.id);
      return project ? reply.send(project) : reply.status(404).send(notFound);
    },
  );

  typed.post(
    '/projects',
    {
      schema: {
        tags: ['projects'],
        body: CreateProjectSchema,
        response: { 201: ProjectSchema },
      },
    },
    async (request, reply) => reply.status(201).send(await service.create(request.body)),
  );

  typed.patch(
    '/projects/:id',
    {
      schema: {
        tags: ['projects'],
        params: ProjectIdParamsSchema,
        body: UpdateProjectSchema,
        response: { 200: ProjectSchema, 404: ApiErrorSchema },
      },
    },
    async (request, reply) => {
      const project = await service.update(request.params.id, request.body);
      return project ? reply.send(project) : reply.status(404).send(notFound);
    },
  );

  typed.delete(
    '/projects/:id',
    {
      schema: {
        tags: ['projects'],
        params: ProjectIdParamsSchema,
      },
    },
    async (request, reply) => {
      const removed = await service.remove(request.params.id);
      return removed ? reply.status(204).send() : reply.status(404).send(notFound);
    },
  );
}

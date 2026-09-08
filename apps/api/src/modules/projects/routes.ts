import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  ApiErrorSchema,
  CreateProjectSchema,
  ProjectIdParamsSchema,
  ProjectListSchema,
  ProjectSchema,
  UpdateProjectSchema,
} from '@hdl/shared';
import { InMemoryProjectRepository, type ProjectRepository } from './repository.js';

const notFound = {
  statusCode: 404,
  error: 'Not Found',
  message: 'Projeto nao encontrado',
} as const;

/** CRUD de projetos (RF07). */
export async function projectRoutes(
  app: FastifyInstance,
  options: { repository?: ProjectRepository } = {},
): Promise<void> {
  const repository = options.repository ?? new InMemoryProjectRepository();
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/projects',
    { schema: { tags: ['projects'], response: { 200: ProjectListSchema } } },
    async () => {
      const items = await repository.list();
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
      const project = await repository.findById(request.params.id);
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
    async (request, reply) => reply.status(201).send(await repository.create(request.body)),
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
      const project = await repository.update(request.params.id, request.body);
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
      const removed = await repository.remove(request.params.id);
      return removed ? reply.status(204).send() : reply.status(404).send(notFound);
    },
  );
}

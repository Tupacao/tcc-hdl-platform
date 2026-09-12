import { after, test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { PrismaProjectRepository } from '../../application/projects/repository/prisma-project.repository.js';
import { runProjectRepositoryContract } from './project-repository.contract.js';

/**
 * Mesmo contrato de `in-memory-project.repository.test.ts`, agora contra
 * Postgres real (RF07-I01). Exige `DATABASE_URL` apontando para um banco com a
 * migracao aplicada (`docker compose up -d postgres` + `prisma migrate dev`);
 * sem a variavel, so registra um teste pulado em vez de falhar o CI local.
 */
if (process.env.DATABASE_URL) {
  const prisma = new PrismaClient();
  after(() => prisma.$disconnect());
  runProjectRepositoryContract(
    'PrismaProjectRepository',
    () => new PrismaProjectRepository(prisma),
  );
} else {
  test(
    'PrismaProjectRepository: pulado sem DATABASE_URL (suba o Postgres para rodar)',
    { skip: true },
    () => {},
  );
}

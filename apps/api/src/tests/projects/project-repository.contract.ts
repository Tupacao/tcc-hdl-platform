import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CreateProject } from '@tplab/shared';
import type { ProjectRepository } from '../../domain/projects/repositories/project.repository.js';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

const sampleSources: CreateProject['sources'] = {
  language: 'verilog',
  topModule: 'full_adder_tb',
  design: { name: 'full_adder.v', content: 'module full_adder(); endmodule' },
  testbench: { name: 'full_adder_tb.v', content: 'module full_adder_tb(); endmodule' },
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Suite de contrato aplicada a qualquer `ProjectRepository` (RF07-I01): a
 * mesma bateria precisa passar na implementacao em memoria e na de
 * Prisma/Postgres. Cada teste remove o que criou, para nao acumular lixo no
 * banco real entre execucoes.
 */
export function runProjectRepositoryContract(
  label: string,
  makeRepository: () => ProjectRepository | Promise<ProjectRepository>,
): void {
  test(`${label}: cria e lista por updatedAt decrescente`, async () => {
    const repository = await makeRepository();
    const first = await repository.create({ name: 'A', sources: sampleSources });
    await wait(5);
    const second = await repository.create({ name: 'B', sources: sampleSources });

    try {
      const ids = (await repository.list()).map((item) => item.id);
      assert.ok(ids.indexOf(second.id) < ids.indexOf(first.id));
    } finally {
      await repository.remove(first.id);
      await repository.remove(second.id);
    }
  });

  test(`${label}: findById devolve null para id inexistente`, async () => {
    const repository = await makeRepository();
    assert.equal(await repository.findById(NON_EXISTENT_ID), null);
  });

  test(`${label}: create preenche description null quando omitida`, async () => {
    const repository = await makeRepository();
    const project = await repository.create({ name: 'Sem descricao', sources: sampleSources });

    try {
      assert.equal(project.description, null);
    } finally {
      await repository.remove(project.id);
    }
  });

  test(`${label}: update parcial preserva campos nao enviados`, async () => {
    const repository = await makeRepository();
    const created = await repository.create({
      name: 'Original',
      description: 'Descricao original',
      sources: sampleSources,
    });

    try {
      const updated = await repository.update(created.id, { name: 'Renomeado' });
      assert.equal(updated?.name, 'Renomeado');
      assert.equal(updated?.description, 'Descricao original');
      assert.deepEqual(updated?.sources, sampleSources);
    } finally {
      await repository.remove(created.id);
    }
  });

  test(`${label}: update com description explicitamente null limpa o campo`, async () => {
    const repository = await makeRepository();
    const created = await repository.create({
      name: 'Com descricao',
      description: 'Vai sumir',
      sources: sampleSources,
    });

    try {
      const updated = await repository.update(created.id, { description: null });
      assert.equal(updated?.description, null);
      assert.equal(updated?.name, 'Com descricao');
    } finally {
      await repository.remove(created.id);
    }
  });

  test(`${label}: update em id inexistente devolve null`, async () => {
    const repository = await makeRepository();
    const updated = await repository.update(NON_EXISTENT_ID, { name: 'Nao existe' });
    assert.equal(updated, null);
  });

  test(`${label}: remove devolve true na primeira vez e false depois`, async () => {
    const repository = await makeRepository();
    const created = await repository.create({ name: 'Para remover', sources: sampleSources });

    assert.equal(await repository.remove(created.id), true);
    assert.equal(await repository.remove(created.id), false);
    assert.equal(await repository.findById(created.id), null);
  });
}

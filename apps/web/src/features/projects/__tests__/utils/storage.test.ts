import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { LocalProject } from '../../models/types';
import { ProjectStorageWriteError, readProjects, writeProjects } from '../../utils/storage';

class FakeStorage {
  #data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.#data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.#data.set(key, value);
  }
}

class ThrowingStorage {
  setItem(): never {
    throw new DOMException('QuotaExceededError');
  }
}

const sampleProject: LocalProject = {
  id: '1',
  name: 'contador',
  description: null,
  sources: {
    language: 'verilog',
    topModule: 'contador_tb',
    design: { name: 'contador.v', content: 'module contador(); endmodule' },
    testbench: { name: 'contador_tb.v', content: 'module contador_tb(); endmodule' },
  },
  lastRun: { kind: 'never' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test('readProjects sem nada gravado devolve lista vazia', () => {
  assert.deepEqual(readProjects(new FakeStorage()), []);
});

test('writeProjects seguido de readProjects devolve o mesmo conteudo', () => {
  const storage = new FakeStorage();
  writeProjects(storage, [sampleProject]);
  assert.deepEqual(readProjects(storage), [sampleProject]);
});

test('readProjects ignora JSON corrompido em vez de lancar excecao', () => {
  const storage = new FakeStorage();
  storage.setItem('tplab:projects', '{ nao e json valido');
  assert.deepEqual(readProjects(storage), []);
});

test('readProjects descarta itens que nao batem com o schema, mantendo os validos', () => {
  const storage = new FakeStorage();
  storage.setItem('tplab:projects', JSON.stringify([sampleProject, { id: '2', name: 'quebrado' }]));
  assert.deepEqual(readProjects(storage), [sampleProject]);
});

test('writeProjects lanca ProjectStorageWriteError quando o navegador recusa a escrita', () => {
  assert.throws(() => writeProjects(new ThrowingStorage(), []), ProjectStorageWriteError);
});

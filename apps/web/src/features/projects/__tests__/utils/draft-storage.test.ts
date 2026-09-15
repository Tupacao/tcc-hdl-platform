import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ProjectDraft } from '../../models/types';
import { clearDraft, readDraft, writeDraft } from '../../utils/draft-storage';

class FakeStorage {
  #data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.#data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.#data.set(key, value);
  }
  removeItem(key: string): void {
    this.#data.delete(key);
  }
}

class ThrowingStorage {
  getItem(): never {
    throw new DOMException('SecurityError');
  }
  setItem(): never {
    throw new DOMException('QuotaExceededError');
  }
  removeItem(): never {
    throw new DOMException('SecurityError');
  }
}

const sampleDraft: ProjectDraft = {
  sources: {
    language: 'verilog',
    topModule: 'contador_tb',
    design: { name: 'contador.v', content: 'module contador(); endmodule' },
    testbench: { name: 'contador_tb.v', content: 'module contador_tb(); endmodule' },
  },
  savedAt: '2026-01-01T00:00:00.000Z',
};

test('readDraft sem nada gravado devolve null', () => {
  assert.equal(readDraft(new FakeStorage(), 'p1'), null);
});

test('writeDraft seguido de readDraft devolve o mesmo conteudo', () => {
  const storage = new FakeStorage();
  writeDraft(storage, 'p1', sampleDraft);
  assert.deepEqual(readDraft(storage, 'p1'), sampleDraft);
});

test('rascunhos de projetos diferentes nao se misturam', () => {
  const storage = new FakeStorage();
  writeDraft(storage, 'p1', sampleDraft);
  assert.equal(readDraft(storage, 'p2'), null);
});

test('readDraft ignora JSON corrompido em vez de lancar excecao', () => {
  const storage = new FakeStorage();
  storage.setItem('tplab:draft:p1', '{ nao e json valido');
  assert.equal(readDraft(storage, 'p1'), null);
});

test('readDraft descarta um rascunho que nao bate com o schema', () => {
  const storage = new FakeStorage();
  storage.setItem('tplab:draft:p1', JSON.stringify({ sources: {}, savedAt: 'nao e data' }));
  assert.equal(readDraft(storage, 'p1'), null);
});

test('clearDraft remove o rascunho gravado', () => {
  const storage = new FakeStorage();
  writeDraft(storage, 'p1', sampleDraft);
  clearDraft(storage, 'p1');
  assert.equal(readDraft(storage, 'p1'), null);
});

test('writeDraft e clearDraft degradam em silencio quando o navegador recusa o acesso', () => {
  const storage = new ThrowingStorage();
  assert.doesNotThrow(() => writeDraft(storage, 'p1', sampleDraft));
  assert.doesNotThrow(() => clearDraft(storage, 'p1'));
});

test('readDraft degrada para null quando o navegador recusa o acesso', () => {
  assert.equal(readDraft(new ThrowingStorage(), 'p1'), null);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SHORTCUTS, formatCombo, matchesShortcut, getShortcut } from '../../utils/shortcuts';

const base = { key: '', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };

test('formatCombo usa Ctrl no Windows/Linux e simbolos no macOS', () => {
  const run = getShortcut('run').combo;
  assert.deepEqual(formatCombo(run, false), ['Ctrl', 'Enter']);
  assert.deepEqual(formatCombo(run, true), ['⌘', '⏎']);
  assert.deepEqual(formatCombo(getShortcut('save').combo, false), ['Ctrl', 'S']);
  assert.deepEqual(formatCombo(getShortcut('previous-diagnostic').combo, false), ['Shift', 'F8']);
});

test('matchesShortcut trata Ctrl e Cmd conforme a plataforma', () => {
  const run = getShortcut('run').combo;
  assert.equal(matchesShortcut({ ...base, key: 'Enter', ctrlKey: true }, run, false), true);
  assert.equal(matchesShortcut({ ...base, key: 'Enter', metaKey: true }, run, false), false);
  assert.equal(matchesShortcut({ ...base, key: 'Enter', metaKey: true }, run, true), true);
  assert.equal(matchesShortcut({ ...base, key: 'Enter' }, run, false), false);
});

test('F8 e Shift+F8 sao distintos', () => {
  const next = getShortcut('next-diagnostic').combo;
  const previous = getShortcut('previous-diagnostic').combo;
  const f8 = { ...base, key: 'F8' };
  assert.equal(matchesShortcut(f8, next, false), true);
  assert.equal(matchesShortcut(f8, previous, false), false);
  assert.equal(matchesShortcut({ ...f8, shiftKey: true }, previous, false), true);
});

test('? funciona com Shift e Alt bloqueia qualquer combo', () => {
  const help = getShortcut('help').combo;
  assert.equal(matchesShortcut({ ...base, key: '?', shiftKey: true }, help, false), true);
  assert.equal(matchesShortcut({ ...base, key: '?', altKey: true }, help, false), false);
});

test('todo atalho tem id unico e descricao', () => {
  const ids = SHORTCUTS.map((shortcut) => shortcut.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(SHORTCUTS.every((shortcut) => shortcut.description.length > 0));
});

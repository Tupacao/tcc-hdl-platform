import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SURVEY_FORM_LABEL, SURVEY_FORM_URL } from '../../utils/messages';

test('o formulário aponta para o link curto do Google Forms, em HTTPS', () => {
  const url = new URL(SURVEY_FORM_URL);

  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'forms.gle');
  assert.equal(url.pathname, '/fHcTNSBf1cc68Joz5');
});

test('o rótulo do formulário não está vazio', () => {
  assert.ok(SURVEY_FORM_LABEL.trim().length > 0);
});

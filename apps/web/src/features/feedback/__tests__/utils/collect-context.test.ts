import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  collectFeedbackContext,
  describeBrowser,
  describeFeedbackContext,
} from '../../utils/collect-context';
import type { RunContextSnapshot } from '../../models/feedback';

const SEM_EXECUCAO: RunContextSnapshot = {
  projectId: null,
  projectName: null,
  lastRun: null,
  compilerOutput: null,
};

const COM_EXECUCAO: RunContextSnapshot = {
  projectId: 'proj-1',
  projectName: 'somador4',
  lastRun: 'falhou · 1 erro · 0,12 s',
  compilerOutput: 'somador4.v:19: syntax error',
};

const BASE = {
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  sessionId: 'a3f9c21e',
};

test('o contexto carrega navegador, tela e sessao mesmo sem nenhuma execucao', () => {
  const context = collectFeedbackContext({ ...BASE, run: SEM_EXECUCAO });

  assert.equal(context.userAgent, BASE.userAgent);
  assert.equal(context.viewport, '1920x1080');
  assert.equal(context.sessionId, 'a3f9c21e');
  assert.equal(context.projectId, undefined);
  assert.equal(context.compilerOutput, undefined);
});

test('com execucao, leva projeto, desfecho e saida do compilador', () => {
  const context = collectFeedbackContext({ ...BASE, run: COM_EXECUCAO });

  assert.equal(context.projectId, 'proj-1');
  assert.equal(context.lastFailure, 'falhou');
  assert.equal(context.compilerOutput, 'somador4.v:19: syntax error');
});

test('o codigo do circuito nunca entra no contexto', () => {
  const context = collectFeedbackContext({ ...BASE, run: COM_EXECUCAO });
  const serialized = JSON.stringify(context);

  assert.doesNotMatch(serialized, /module|endmodule|assign/);
  // A lista de chaves e fechada: um campo novo precisa passar por aqui.
  assert.deepEqual(Object.keys(context).sort(), [
    'compilerOutput',
    'lastFailure',
    'projectId',
    'sessionId',
    'userAgent',
    'viewport',
  ]);
});

test('a lista mostrada ao usuario descreve exatamente o que vai junto', () => {
  const context = collectFeedbackContext({ ...BASE, run: COM_EXECUCAO });
  const lines = describeFeedbackContext(context, COM_EXECUCAO);

  assert.deepEqual(
    lines.map((line) => line.label),
    [
      'navegador',
      'tela',
      'projeto',
      'última execução',
      'saída do compilador',
      'identificador da sessão',
    ],
  );
  assert.equal(lines[1]?.value, '1920 × 1080');
  assert.equal(lines[2]?.value, 'somador4');
  assert.match(lines[5]?.value ?? '', /anônimo/);
});

test('sem execucao, a lista nao inventa linhas de projeto nem de compilador', () => {
  const context = collectFeedbackContext({ ...BASE, run: SEM_EXECUCAO });
  const lines = describeFeedbackContext(context, SEM_EXECUCAO);

  assert.deepEqual(
    lines.map((line) => line.label),
    ['navegador', 'tela', 'identificador da sessão'],
  );
});

test('describeBrowser reconhece os navegadores testados (RNF02)', () => {
  assert.equal(describeBrowser(BASE.userAgent), 'Chrome 131 · Windows');
  assert.equal(
    describeBrowser('Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0'),
    'Firefox 133 · Linux',
  );
  assert.equal(
    describeBrowser(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.1 Safari/605.1.15',
    ),
    'Safari 18 · macOS',
  );
  assert.equal(
    describeBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Edg/131.0.0.0'),
    'Edge 131 · Windows',
  );
});

test('navegador desconhecido degrada para o inicio do userAgent, sem quebrar', () => {
  const value = describeBrowser('AgenteEstranho/1.0');
  assert.equal(value, 'AgenteEstranho/1.0');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DefaultHealthService } from '../../application/health/service/health.service.js';

test('DefaultHealthService.check devolve status ok, uptime numerico e versao', () => {
  const status = new DefaultHealthService().check();

  assert.equal(status.status, 'ok');
  assert.equal(typeof status.uptime, 'number');
  assert.ok(status.uptime >= 0);
  assert.equal(typeof status.version, 'string');
});

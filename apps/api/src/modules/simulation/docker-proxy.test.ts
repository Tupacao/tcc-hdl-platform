import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildSandboxContainerOptions,
  dockerConnectionOptions,
  type SandboxLimits,
} from './sandbox.js';

// RNF04-I02 — o proxy do socket do Docker (`infra/docker-proxy/policy.mjs`) recusa qualquer
// `create` que nao seja exatamente o que `buildSandboxContainerOptions` monta. Este teste e o
// que impede as duas pontas de divergirem em silencio: mudar as opcoes do container sem mudar
// a politica faria o worker ser recusado em producao, so depois do deploy.

interface Policy {
  validateCreateBody: (body: unknown, config: Record<string, unknown>) => string | null;
}

const policyUrl = new URL('../../../../../infra/docker-proxy/policy.mjs', import.meta.url);
const policy = (await import(policyUrl.href)) as Policy;

const proxyConfig = {
  image: 'tplab-sandbox:latest',
  workRoot: '/var/lib/tplab/work',
  maxMemoryMb: 512,
  maxCpus: 2,
  maxPids: 256,
};

const LIMITS: SandboxLimits = {
  image: 'tplab-sandbox:latest',
  timeoutMs: 10_000,
  compileTimeoutMs: 5_000,
  memoryMb: 128,
  cpus: 0.5,
};

test('o proxy aceita exatamente o create que runInSandbox monta', () => {
  const options = buildSandboxContainerOptions('/var/lib/tplab/work/hdl-sim-Ab12Cd', LIMITS);
  assert.equal(policy.validateCreateBody(options, proxyConfig), null);
});

test('o proxy recusa o create de um workdir fora da raiz configurada', () => {
  const options = buildSandboxContainerOptions('/tmp/hdl-sim-Ab12Cd', LIMITS);
  assert.match(policy.validateCreateBody(options, proxyConfig) ?? '', /Binds/);
});

test('dockerConnectionOptions: tcp, unix e vazio', () => {
  assert.deepEqual(dockerConnectionOptions(undefined), {});
  assert.deepEqual(dockerConnectionOptions('tcp://docker-proxy:2375'), {
    protocol: 'http',
    host: 'docker-proxy',
    port: 2375,
  });
  assert.deepEqual(dockerConnectionOptions('unix:///var/run/docker.sock'), {
    socketPath: '/var/run/docker.sock',
  });
});

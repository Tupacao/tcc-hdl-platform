import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateRequest, normalizePath, validateCreateBody } from './policy.mjs';

const config = {
  images: ['tplab-sandbox:latest', 'tplab-sandbox-ghdl:latest'],
  workRoot: '/var/lib/tplab/work',
  maxMemoryMb: 512,
  maxCpus: 2,
  maxPids: 256,
};

function validBody() {
  return {
    Image: 'tplab-sandbox:latest',
    WorkingDir: '/work',
    User: 'sandbox',
    Env: ['SIM_TIMEOUT_S=10', 'SIM_COMPILE_TIMEOUT_S=5'],
    Labels: { 'tplab.sandbox': 'true' },
    NetworkDisabled: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    HostConfig: {
      AutoRemove: false,
      NetworkMode: 'none',
      Binds: ['/var/lib/tplab/work/hdl-sim-Ab12Cd:/work:rw'],
      ReadonlyRootfs: true,
      Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=32m' },
      Memory: 128 * 1024 * 1024,
      MemorySwap: 128 * 1024 * 1024,
      NanoCpus: 0.5e9,
      PidsLimit: 128,
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      LogConfig: { Type: 'json-file', Config: { 'max-size': '1m', 'max-file': '2' } },
    },
  };
}

function withHost(overrides) {
  const body = validBody();
  body.HostConfig = { ...body.HostConfig, ...overrides };
  return body;
}

test('o corpo que runInSandbox monta e aceito', () => {
  assert.equal(validateCreateBody(validBody(), config), null);
});

// --- O que o proxy PRECISA recusar (a razao de ele existir) -----------------------------

const refused = {
  'container privilegiado': withHost({ Privileged: true }),
  'bind arbitrario da raiz do host': withHost({ Binds: ['/:/host:rw'] }),
  'bind do proprio socket do Docker': withHost({
    Binds: [
      '/var/lib/tplab/work/hdl-sim-Ab12Cd:/work:rw',
      '/var/run/docker.sock:/var/run/docker.sock',
    ],
  }),
  'bind fora do diretorio de trabalho': withHost({ Binds: ['/etc:/work:rw'] }),
  'bind com travessia de diretorio': withHost({
    Binds: ['/var/lib/tplab/work/../../../etc:/work:rw'],
  }),
  'bind sem o prefixo hdl-sim-': withHost({ Binds: ['/var/lib/tplab/work/outro:/work:rw'] }),
  'bind montado fora de /work': withHost({
    Binds: ['/var/lib/tplab/work/hdl-sim-Ab12Cd:/host:rw'],
  }),
  'mount arbitrario por Mounts': withHost({
    Mounts: [{ Type: 'bind', Source: '/', Target: '/host' }],
  }),
  'rede do host': withHost({ NetworkMode: 'host' }),
  'capability extra': withHost({ CapAdd: ['SYS_ADMIN'] }),
  'CapDrop incompleto': withHost({ CapDrop: ['NET_RAW'] }),
  'sem no-new-privileges': withHost({ SecurityOpt: [] }),
  'seccomp desligado': withHost({ SecurityOpt: ['no-new-privileges', 'seccomp=unconfined'] }),
  'namespace de PIDs do host': withHost({ PidMode: 'host' }),
  'namespace IPC do host': withHost({ IpcMode: 'host' }),
  'device do host': withHost({
    Devices: [{ PathOnHost: '/dev/sda', PathInContainer: '/dev/sda' }],
  }),
  'rootfs gravavel': withHost({ ReadonlyRootfs: false }),
  'tmpfs com exec': withHost({ Tmpfs: { '/tmp': 'rw,exec,size=32m' } }),
  'tmpfs extra': withHost({ Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=32m', '/var': 'rw' } }),
  'memoria acima do teto': withHost({ Memory: 4096 * 1024 * 1024, MemorySwap: 4096 * 1024 * 1024 }),
  'memoria sem teto': withHost({ Memory: 0, MemorySwap: 0 }),
  'swap liberado': withHost({ MemorySwap: 512 * 1024 * 1024 }),
  'CPU acima do teto': withHost({ NanoCpus: 32e9 }),
  'PIDs acima do teto': withHost({ PidsLimit: 100000 }),
  'PIDs sem limite': withHost({ PidsLimit: -1 }),
  'log sem rotacao': withHost({ LogConfig: { Type: 'json-file', Config: {} } }),
  'AutoRemove ligado': withHost({ AutoRemove: true }),
  'runtime alternativo': withHost({ Runtime: 'runc-other' }),
  'usuario do container': { ...validBody(), User: 'root' },
  'imagem diferente': { ...validBody(), Image: 'alpine:latest' },
  'entrypoint sobrescrito': { ...validBody(), Entrypoint: ['/bin/sh'] },
  'comando sobrescrito': { ...validBody(), Cmd: ['sh', '-c', 'id'] },
  'rede habilitada': { ...validBody(), NetworkDisabled: false },
  'variavel de ambiente arbitraria': { ...validBody(), Env: ['SIM_TIMEOUT_S=10', 'PATH=/x'] },
  'variavel numerica com injecao': {
    ...validBody(),
    Env: ['SIM_TIMEOUT_S=10; id', 'SIM_COMPILE_TIMEOUT_S=5'],
  },
  'rotulo diferente': { ...validBody(), Labels: { 'tplab.sandbox': 'true', extra: '1' } },
  'sem rotulo': { ...validBody(), Labels: {} },
  'porta publicada por ExposedPorts': { ...validBody(), ExposedPorts: { '80/tcp': {} } },
  'volume anonimo por Volumes': { ...validBody(), Volumes: { '/x': {} } },
  'sem HostConfig': (() => {
    const body = validBody();
    delete body.HostConfig;
    return body;
  })(),
  'corpo que nao e objeto': 'texto',
  'corpo nulo': null,
};

for (const [name, body] of Object.entries(refused)) {
  test(`create recusado: ${name}`, () => {
    assert.notEqual(validateCreateBody(body, config), null, 'o proxy deveria ter recusado');
  });
}

// --- Rotas ----------------------------------------------------------------------------

const ID = 'a'.repeat(64);
const LIST = `/containers/json?all=true&filters=${encodeURIComponent(JSON.stringify({ label: ['tplab.sandbox=true'] }))}`;

const allowed = [
  ['POST', '/containers/create', 'create'],
  // O dockerode repete os campos do corpo na query string.
  [
    'POST',
    '/containers/create?Image=tplab-sandbox%3Alatest&HostConfig=%7B%7D&Env=%5B%5D',
    'create',
  ],
  ['POST', `/containers/${ID}/start`, 'container'],
  ['POST', `/containers/${ID}/wait`, 'container'],
  ['POST', `/containers/${ID}/kill`, 'container'],
  ['POST', `/containers/${ID}/kill?signal=KILL`, 'container'],
  ['GET', `/containers/${ID}/logs?stdout=1&stderr=1&follow=0`, 'container'],
  ['GET', `/containers/${ID}/json`, 'container'],
  ['DELETE', `/containers/${ID}?force=true`, 'container'],
  ['GET', LIST, 'list'],
  ['POST', `/v1.47/containers/${ID}/start`, 'container'],
];

for (const [method, url, kind] of allowed) {
  test(`rota permitida: ${method} ${url.slice(0, 60)}`, () => {
    const decision = evaluateRequest({ method, url });
    assert.equal(decision.allow, true, decision.reason);
    assert.equal(decision.kind, kind);
  });
}

const blocked = [
  ['POST', `/containers/${ID}/exec`],
  ['POST', `/containers/${ID}/attach`],
  ['POST', `/containers/${ID}/update`],
  ['POST', `/containers/${ID}/restart`],
  ['POST', `/containers/${ID}/rename?name=x`],
  ['POST', `/containers/${ID}/commit`],
  ['GET', `/containers/${ID}/archive?path=/etc`],
  ['PUT', `/containers/${ID}/archive?path=/`],
  ['GET', `/containers/${ID}/export`],
  ['GET', '/containers/json'],
  ['GET', '/containers/json?all=true'],
  [
    'GET',
    `/containers/json?filters=${encodeURIComponent(JSON.stringify({ label: ['outra=true'] }))}`,
  ],
  ['POST', '/containers/create?name=x'],
  ['POST', '/containers/create?platform=linux%2Farm64'],
  ['POST', '/containers/create?Privileged=true'],
  ['POST', '/exec/abc/start'],
  ['GET', '/images/json'],
  ['POST', '/images/create?fromImage=alpine'],
  ['POST', '/build'],
  ['GET', '/volumes'],
  ['POST', '/volumes/create'],
  ['GET', '/networks'],
  ['POST', '/networks/create'],
  ['GET', '/info'],
  ['GET', '/version'],
  ['GET', '/events'],
  ['POST', '/swarm/init'],
  ['GET', '/services'],
  ['POST', '/containers/prune'],
  ['DELETE', `/containers/${ID}?force=true&link=true`],
  ['POST', `/containers/${ID}/kill?signal=TERM`],
  ['POST', '/containers/tplab-postgres-1/start'],
  ['DELETE', '/containers/postgres'],
  ['GET', `/containers/${ID}/../../images/json`],
  ['GET', `/containers/%2e%2e/json`],
];

for (const [method, url] of blocked) {
  test(`rota recusada: ${method} ${url.slice(0, 70)}`, () => {
    assert.equal(evaluateRequest({ method, url }).allow, false);
  });
}

test('normalizePath tira o prefixo de versao e recusa travessia', () => {
  assert.equal(normalizePath('/v1.47/containers/json'), '/containers/json');
  assert.equal(normalizePath('/containers/json'), '/containers/json');
  assert.equal(normalizePath('/containers/../images'), null);
  assert.equal(normalizePath('/containers//json'), null);
  assert.equal(normalizePath('/containers/%2e%2e/json'), null);
});

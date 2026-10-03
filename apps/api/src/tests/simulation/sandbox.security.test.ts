import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  SANDBOX_LABEL,
  buildSandboxContainerOptions,
  prepareWorkdir,
  removeOrphanWorkdirs,
} from '../../infra/sandbox/sandbox.js';
import type { SandboxLimits } from '../../domain/simulation/entities/sandbox.js';

const LIMITS: SandboxLimits = {
  image: 'tplab-sandbox:test',
  timeoutMs: 7_500,
  compileTimeoutMs: 2_100,
  memoryMb: 96,
  cpus: 0.25,
};
const options = buildSandboxContainerOptions('/tmp/hdl-sim-abc', LIMITS);
const host = options.HostConfig!;

// RNF04-I01 — protege contra remocao acidental (ou erro de digitacao no nome) de uma
// barreira: o Docker ignora chave desconhecida em silencio, entao so um teste que
// confira cada chave e valor percebe. Nao precisa de Docker.

test('rede: sem rede nenhuma, nem interface', () => {
  assert.equal(options.NetworkDisabled, true);
  assert.equal(host.NetworkMode, 'none');
});

test('sistema de arquivos: rootfs somente leitura e unico bind e o workdir', () => {
  assert.equal(host.ReadonlyRootfs, true);
  assert.deepEqual(host.Binds, ['/tmp/hdl-sim-abc:/work:rw']);
  assert.equal(host.Privileged, undefined);
  assert.equal(host.PublishAllPorts, undefined);
  assert.equal(host.Devices, undefined);
});

test('/tmp do container: tmpfs sem execucao, sem suid e com teto de tamanho', () => {
  assert.equal(host.Tmpfs?.['/tmp'], 'rw,noexec,nosuid,size=32m');
  assert.deepEqual(Object.keys(host.Tmpfs ?? {}), ['/tmp']);
});

test('privilegios: sem capabilities, sem escalada e usuario nao privilegiado', () => {
  assert.deepEqual(host.CapDrop, ['ALL']);
  assert.equal(host.CapAdd, undefined);
  assert.deepEqual(host.SecurityOpt, ['no-new-privileges']);
  assert.equal(options.User, 'sandbox');
});

test('recursos: memoria sem swap, CPU e PIDs limitados vindos dos limites informados', () => {
  assert.equal(host.Memory, 96 * 1024 * 1024);
  assert.equal(host.MemorySwap, host.Memory);
  assert.equal(host.NanoCpus, 0.25e9);
  assert.equal(host.PidsLimit, 128);
});

test('ambiente: so os dois tetos de tempo — nada da API chega ao container', () => {
  assert.deepEqual(options.Env, ['SIM_TIMEOUT_S=8', 'SIM_COMPILE_TIMEOUT_S=3']);
});

test('rotulo: todo container de simulacao e rotulado para a varredura de orfaos', () => {
  assert.deepEqual(options.Labels, { [SANDBOX_LABEL]: 'true' });
});

test('log: rotacionado (1 MiB x 2) — $display em laco nao enche o disco do host nem estoura o docker-modem', () => {
  assert.deepEqual(host.LogConfig, {
    Type: 'json-file',
    Config: { 'max-size': '1m', 'max-file': '2' },
  });
});

test('efemero: sem AutoRemove (removido explicitamente apos ler os logs) e sem TTY', () => {
  assert.equal(host.AutoRemove, false);
  assert.equal(options.Tty, false);
});

test('removeOrphanWorkdirs apaga so diretorios hdl-sim-* mais velhos que o limite', async () => {
  // Raiz propria: nunca toca em diretorio de um job real em andamento no tmpdir da maquina.
  const root = await mkdtemp(join(tmpdir(), 'sandbox-security-test-'));
  const orphan = join(root, 'hdl-sim-abc');
  const unrelated = join(root, 'outro-diretorio');
  await mkdir(orphan);
  await mkdir(unrelated);
  const exists = (path: string) =>
    stat(path).then(
      () => true,
      () => false,
    );
  try {
    // Recente: nao pode ser tocado (pode ser de um job em andamento).
    assert.equal(await removeOrphanWorkdirs(60_000, root), 0);
    assert.ok(await exists(orphan), 'diretorio recente foi removido');

    // Velho (limite 0): removido, mas so o que tem o prefixo do sandbox.
    assert.equal(await removeOrphanWorkdirs(0, root), 1);
    assert.equal(await exists(orphan), false);
    assert.ok(await exists(unrelated), 'diretorio alheio foi removido');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test(
  'prepareWorkdir: dono sandbox (0755) quando ha privilegio, senao 0777 — nunca 0700 (o uid 10001 nao entraria)',
  { skip: process.platform === 'win32' },
  async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sandbox-security-test-'));
    try {
      const result = await prepareWorkdir(dir);
      const info = await stat(dir);
      if (result === 'owner') {
        assert.equal(info.uid, 10001);
        assert.equal(info.mode & 0o777, 0o755);
      } else {
        assert.equal(info.mode & 0o777, 0o777);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);

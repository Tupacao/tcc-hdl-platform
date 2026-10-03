/**
 * Politica do proxy do socket do Docker (RNF04-I02) — funcao pura, sem I/O.
 *
 * O worker precisa criar containers de simulacao, mas acesso ao socket do Docker
 * equivale a `root` no host. Proxies genericos (`tecnativa/docker-socket-proxy`)
 * filtram so por rota: liberar `POST /containers/create` libera **qualquer corpo**,
 * inclusive `Privileged: true` e `Binds: ["/:/host"]` — ganho nulo. Aqui a politica
 * confere o **corpo** do `create` contra exatamente as opcoes que `runInSandbox`
 * monta (`buildSandboxContainerOptions`, em `apps/api/src/modules/simulation/sandbox.ts`):
 * qualquer campo fora da lista, ou com valor diferente, e recusado.
 *
 * Mudar as opcoes do container em `sandbox.ts` exige mudar esta politica — o
 * acoplamento esta registrado em `CLAUDE.md`.
 */

export const SANDBOX_LABEL = 'tplab.sandbox';

/** Container so por id hexadecimal (o que o `create` devolve) — nunca nome, nunca padrao livre. */
const CONTAINER_ID = /^[a-f0-9]{12,64}$/;

const MIB = 1024 * 1024;

const ALLOWED_TOP_LEVEL = new Set([
  'Image',
  'WorkingDir',
  'User',
  'Env',
  'Labels',
  'NetworkDisabled',
  'AttachStdout',
  'AttachStderr',
  'Tty',
  'HostConfig',
]);

const ALLOWED_HOST_CONFIG = new Set([
  'AutoRemove',
  'NetworkMode',
  'Binds',
  'ReadonlyRootfs',
  'Tmpfs',
  'Memory',
  'MemorySwap',
  'NanoCpus',
  'PidsLimit',
  'CapDrop',
  'SecurityOpt',
  'LogConfig',
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Valida o corpo de `POST /containers/create`. Devolve `null` se aceito, ou o
 * motivo da recusa em uma frase.
 */
export function validateCreateBody(body, config) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'corpo do create precisa ser um objeto JSON';
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_TOP_LEVEL.has(key)) return `campo nao permitido no create: ${key}`;
  }

  if (!config.images.includes(body.Image)) {
    return `imagem nao permitida (so ${config.images.join(', ')})`;
  }
  if (body.WorkingDir !== '/work') return 'WorkingDir precisa ser /work';
  if (body.User !== 'sandbox') return 'User precisa ser sandbox';
  if (body.NetworkDisabled !== true) return 'NetworkDisabled precisa ser true';
  if (body.Tty !== false) return 'Tty precisa ser false';
  if (body.AttachStdout !== true || body.AttachStderr !== true) {
    return 'AttachStdout/AttachStderr precisam ser true';
  }

  if (
    !Array.isArray(body.Env) ||
    body.Env.length !== 2 ||
    !body.Env.every((entry) => /^SIM_(COMPILE_)?TIMEOUT_S=\d{1,3}$/.test(String(entry)))
  ) {
    return 'Env so aceita SIM_TIMEOUT_S e SIM_COMPILE_TIMEOUT_S numericos';
  }

  if (!sameJson(body.Labels, { [SANDBOX_LABEL]: 'true' })) {
    return `Labels precisa ser exatamente {${SANDBOX_LABEL}: true}`;
  }

  const host = body.HostConfig;
  if (host === null || typeof host !== 'object' || Array.isArray(host)) {
    return 'HostConfig obrigatorio';
  }
  for (const key of Object.keys(host)) {
    if (!ALLOWED_HOST_CONFIG.has(key)) return `campo nao permitido em HostConfig: ${key}`;
  }

  if (host.AutoRemove !== false) return 'AutoRemove precisa ser false';
  if (host.NetworkMode !== 'none') return 'NetworkMode precisa ser none';
  if (host.ReadonlyRootfs !== true) return 'ReadonlyRootfs precisa ser true';

  const bind = new RegExp(`^${escapeRegExp(config.workRoot)}/hdl-sim-[A-Za-z0-9]{4,32}:/work:rw$`);
  if (!Array.isArray(host.Binds) || host.Binds.length !== 1 || !bind.test(String(host.Binds[0]))) {
    return `Binds so aceita um diretorio hdl-sim-* dentro de ${config.workRoot}, montado em /work:rw`;
  }

  if (!sameJson(host.Tmpfs, { '/tmp': 'rw,noexec,nosuid,size=32m' })) {
    return 'Tmpfs precisa ser exatamente /tmp com noexec,nosuid,size=32m';
  }

  const memory = host.Memory;
  if (!Number.isInteger(memory) || memory < 16 * MIB || memory > config.maxMemoryMb * MIB) {
    return `Memory fora do intervalo permitido (16 MiB a ${config.maxMemoryMb} MiB)`;
  }
  if (host.MemorySwap !== memory) return 'MemorySwap precisa ser igual a Memory (sem swap)';

  const nanoCpus = host.NanoCpus;
  if (!Number.isInteger(nanoCpus) || nanoCpus <= 0 || nanoCpus > config.maxCpus * 1e9) {
    return `NanoCpus fora do intervalo permitido (ate ${config.maxCpus} CPUs)`;
  }

  const pids = host.PidsLimit;
  if (!Number.isInteger(pids) || pids <= 0 || pids > config.maxPids) {
    return `PidsLimit fora do intervalo permitido (ate ${config.maxPids})`;
  }

  if (!sameJson(host.CapDrop, ['ALL'])) return 'CapDrop precisa ser [ALL]';
  if (!sameJson(host.SecurityOpt, ['no-new-privileges'])) {
    return 'SecurityOpt precisa ser [no-new-privileges]';
  }
  if (
    !sameJson(host.LogConfig, {
      Type: 'json-file',
      Config: { 'max-size': '1m', 'max-file': '2' },
    })
  ) {
    return 'LogConfig precisa ser json-file com max-size 1m e max-file 2';
  }

  return null;
}

/** Remove o prefixo de versao da API (`/v1.47/containers/...`) e recusa caminho suspeito. */
export function normalizePath(rawPath) {
  const path = rawPath.replace(/^\/v\d+(\.\d+)?(?=\/)/, '');
  if (path.includes('..') || path.includes('%') || path.includes('//')) return null;
  return path;
}

function onlyParams(searchParams, allowed) {
  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) return `parametro de query nao permitido: ${key}`;
  }
  return null;
}

const NO_PARAMS = new Set();

/**
 * Decide o que fazer com uma requisicao. `kind`:
 * - `create`: o proxy valida o corpo (`validateCreateBody`) antes de encaminhar;
 * - `container`: operacao sobre um container existente — o proxy so encaminha se o
 *   container tiver o rotulo do sandbox (`id` no resultado);
 * - `list`: listagem restrita ao rotulo do sandbox.
 * Tudo que nao esta aqui — `exec`, `attach`, `images`, `volumes`, `networks`, `build`,
 * `commit`, `update`, `archive`, `swarm` — e recusado.
 */
export function evaluateRequest({ method, url }) {
  const parsed = new URL(url, 'http://proxy');
  const path = normalizePath(parsed.pathname);
  if (path === null) return { allow: false, reason: 'caminho invalido' };
  const params = parsed.searchParams;

  if (method === 'POST' && path === '/containers/create') {
    // O dockerode repete os campos do corpo na query string (docker-modem monta a query a partir
    // das opcoes). O daemon so honra `name`/`platform` nesse caminho e o proxy encaminha o create
    // SEM query (ver `proxy.mjs`), entao aceitar so nomes de campos do corpo e inofensivo — `name`
    // e `platform` continuam recusados.
    const bad = onlyParams(params, ALLOWED_TOP_LEVEL);
    return bad ? { allow: false, reason: bad } : { allow: true, kind: 'create' };
  }

  if (method === 'GET' && path === '/containers/json') {
    const bad = onlyParams(params, new Set(['all', 'filters']));
    if (bad) return { allow: false, reason: bad };
    let filters;
    try {
      filters = JSON.parse(params.get('filters') ?? 'null');
    } catch {
      filters = null;
    }
    if (!sameJson(filters, { label: [`${SANDBOX_LABEL}=true`] })) {
      return {
        allow: false,
        reason: `a listagem exige filters={"label":["${SANDBOX_LABEL}=true"]}`,
      };
    }
    return { allow: true, kind: 'list' };
  }

  const match = /^\/containers\/([^/]+)(?:\/(start|kill|wait|logs|json))?$/.exec(path);
  if (match) {
    const id = match[1];
    const action = match[2];
    if (!CONTAINER_ID.test(id)) return { allow: false, reason: 'container so por id hexadecimal' };

    if (method === 'POST' && action === 'start') {
      const bad = onlyParams(params, NO_PARAMS);
      return bad ? { allow: false, reason: bad } : { allow: true, kind: 'container', id };
    }
    if (method === 'POST' && action === 'kill') {
      const bad = onlyParams(params, new Set(['signal']));
      if (bad) return { allow: false, reason: bad };
      const signal = params.get('signal');
      if (signal !== null && signal !== 'KILL' && signal !== 'SIGKILL') {
        return { allow: false, reason: 'kill so aceita o sinal KILL' };
      }
      return { allow: true, kind: 'container', id };
    }
    if (method === 'POST' && action === 'wait') {
      const bad = onlyParams(params, new Set(['condition']));
      return bad ? { allow: false, reason: bad } : { allow: true, kind: 'container', id };
    }
    if (method === 'GET' && action === 'logs') {
      const bad = onlyParams(params, new Set(['stdout', 'stderr', 'follow', 'tail', 'timestamps']));
      return bad ? { allow: false, reason: bad } : { allow: true, kind: 'container', id };
    }
    if (method === 'GET' && action === 'json') {
      const bad = onlyParams(params, NO_PARAMS);
      return bad ? { allow: false, reason: bad } : { allow: true, kind: 'container', id };
    }
    if (method === 'DELETE' && action === undefined) {
      const bad = onlyParams(params, new Set(['force', 'v']));
      return bad ? { allow: false, reason: bad } : { allow: true, kind: 'container', id };
    }
  }

  return { allow: false, reason: `operacao nao permitida: ${method} ${path}` };
}

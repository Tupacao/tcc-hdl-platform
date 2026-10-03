/**
 * Proxy do socket do Docker para o worker de simulacao (RNF04-I02).
 *
 * Fica entre o worker e `/var/run/docker.sock`. O worker (processo Node grande, com
 * dependencias) deixa de ter acesso ao socket; este processo — pequeno, sem
 * dependencias, so `node:http` — e o unico que tem, e so encaminha o que
 * `policy.mjs` permite. Ver `docs/SEGURANCA.md`, secao 7.
 */
import http from 'node:http';
import { SANDBOX_LABEL, evaluateRequest, validateCreateBody } from './policy.mjs';

const config = {
  // Uma imagem por toolchain (RNF08-I02), separadas por virgula.
  images: (
    process.env.PROXY_ALLOWED_IMAGES ?? 'tplab-sandbox:latest,tplab-sandbox-ghdl:latest'
  ).split(','),
  workRoot: (process.env.PROXY_WORK_ROOT ?? '/var/lib/tplab/work').replace(/\/+$/, ''),
  maxMemoryMb: Number(process.env.PROXY_MAX_MEMORY_MB ?? 512),
  maxCpus: Number(process.env.PROXY_MAX_CPUS ?? 2),
  maxPids: Number(process.env.PROXY_MAX_PIDS ?? 256),
};
const SOCKET_PATH = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock';
const PORT = Number(process.env.PROXY_PORT ?? 2375);
const MAX_BODY_BYTES = 64 * 1024;

/** Ids de containers ja confirmados como do sandbox (rotulo) — evita reinspecionar a cada chamada. */
const approved = new Set();

function deny(res, status, reason) {
  console.warn(`[docker-proxy] recusado: ${reason}`);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: `tplab-docker-proxy: ${reason}` }));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('corpo grande demais'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Chamada ao daemon, so para o proprio proxy (inspecao de rotulo, resposta do create). */
function daemonRequest(method, path) {
  return new Promise((resolve, reject) => {
    const request = http.request({ socketPath: SOCKET_PATH, method, path }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () =>
        resolve({ status: response.statusCode, body: Buffer.concat(chunks) }),
      );
    });
    request.on('error', reject);
    request.end();
  });
}

async function hasSandboxLabel(id) {
  if (approved.has(id)) return true;
  const { status, body } = await daemonRequest('GET', `/containers/${id}/json`);
  if (status !== 200) return false;
  const labels = JSON.parse(body.toString('utf8')).Config?.Labels ?? {};
  const ok = labels[SANDBOX_LABEL] === 'true';
  if (ok) approved.add(id);
  return ok;
}

function forward(req, res, body) {
  const headers = { ...req.headers };
  delete headers.connection;
  if (body) headers['content-length'] = String(body.length);

  const upstream = http.request(
    { socketPath: SOCKET_PATH, method: req.method, path: req.url, headers },
    (response) => {
      res.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(res);
      response.on('end', () => {
        if (req.method === 'DELETE' && response.statusCode && response.statusCode < 300) {
          const id = /\/containers\/([a-f0-9]+)/.exec(req.url ?? '')?.[1];
          if (id) approved.delete(id);
        }
      });
    },
  );
  upstream.on('error', (error) => deny(res, 502, `daemon indisponivel: ${error.message}`));
  upstream.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const decision = evaluateRequest({ method: req.method ?? '', url: req.url ?? '' });
    if (!decision.allow) return deny(res, 403, decision.reason);

    if (decision.kind === 'create') {
      const raw = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(raw.toString('utf8'));
      } catch {
        return deny(res, 400, 'corpo do create nao e JSON valido');
      }
      const reason = validateCreateBody(parsed, config);
      if (reason) return deny(res, 403, reason);

      // Encaminha e memoriza o id devolvido: o container que este proxy criou ja nasce aprovado.
      const upstream = http.request(
        {
          socketPath: SOCKET_PATH,
          method: 'POST',
          // Sem query string: so o corpo validado vale (ver o comentario em policy.mjs).
          path: new URL(req.url ?? '', 'http://proxy').pathname,
          headers: { 'content-type': 'application/json', 'content-length': String(raw.length) },
        },
        (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const payload = Buffer.concat(chunks);
            if (response.statusCode === 201) {
              try {
                approved.add(JSON.parse(payload.toString('utf8')).Id);
              } catch {
                // resposta inesperada do daemon: segue sem memorizar; a proxima chamada inspeciona.
              }
            }
            res.writeHead(response.statusCode ?? 502, response.headers);
            res.end(payload);
          });
        },
      );
      upstream.on('error', (error) => deny(res, 502, `daemon indisponivel: ${error.message}`));
      upstream.end(raw);
      return;
    }

    if (decision.kind === 'container') {
      if (!(await hasSandboxLabel(decision.id))) {
        return deny(res, 403, `o container nao tem o rotulo ${SANDBOX_LABEL}=true`);
      }
    }

    forward(req, res, null);
  } catch (error) {
    deny(res, 500, `erro interno do proxy: ${error instanceof Error ? error.message : error}`);
  }
});

// RNF05-I01: sem SwapLimit o MemorySwap nao e aplicado e um estouro de memoria pagina em vez de
// morrer. O worker nao pode perguntar (GET /info e recusado: o proxy nao expoe a configuracao do
// daemon), entao quem tem o socket avisa.
daemonRequest('GET', '/info')
  .then(({ body }) => {
    if (JSON.parse(body.toString('utf8')).SwapLimit !== true) {
      console.warn(
        '[docker-proxy] AVISO: Docker sem SwapLimit — MemorySwap nao e aplicado; o limite de memoria dos containers de simulacao nao protege a maquina (ver docs/SEGURANCA.md)',
      );
    }
  })
  .catch(() => undefined);

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[docker-proxy] escutando em :${PORT} -> ${SOCKET_PATH} (imagens ${config.images.join(', ')}, workdir ${config.workRoot})`,
  );
});

# RF01-I02 - Deploy da API, worker e infraestrutura na VM com HTTPS

| Campo | Valor |
| --- | --- |
| Feature | [RF01](feature.md) |
| Branch | `feat/rf01-deploy-api-worker-vm` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF01-I01 |

## Contexto

`infra/docker-compose.yml` ja descreve postgres, redis, api e worker, mas voltado
para uso local. Producao adiciona tres exigencias: HTTPS, o socket do Docker
disponivel para o worker criar containers efemeros (RNF04) e variaveis de
ambiente reais, fora do repositorio.

## Objetivo

Ter a API publica, com TLS, aceitando chamadas do frontend estatico, com o worker
consumindo a fila normalmente.

## Escopo tecnico

- `infra/docker-compose.yml` ou um `docker-compose.prod.yml` dedicado.
- Reverse proxy (Caddy ou nginx) com certificado automatico.
- `apps/api/src/app.ts` - CORS restrito a origem do frontend.
- `apps/api/src/config/env.ts` - variaveis novas (`CORS_ORIGIN`, etc.).
- `README.md` - documentacao de deploy.

## Passo a passo

1. Criar o compose de producao: postgres e redis sem portas expostas ao host, api
   e worker construidos a partir de `apps/api/Dockerfile`.
2. Montar `/var/run/docker.sock` **somente** no servico do worker - a API nao
   precisa e nao deve ter esse acesso.
3. Garantir que a imagem `tplab-sandbox:latest` seja construida na VM antes de
   subir o worker (`pnpm sandbox:build` ou etapa equivalente no deploy).
4. Adicionar reverse proxy com TLS terminando em `443`, roteando `/api` para a
   API.
5. Registrar plugin de CORS no Fastify aceitando apenas a origem do frontend.
6. Publicar o `dist/` do frontend (Azure Static Web Apps ou servido pelo proprio
   proxy) e apontar `VITE_API_BASE_URL`.
7. Validar `GET /health` publico e uma simulacao fim a fim pela URL publica.

## Criterios de aceite

- [ ] `https://<dominio>/health` responde `200` com certificado valido.
      *(depende de executar o roteiro numa VM)*
- [ ] Uma simulacao submetida pela URL publica retorna diagnosticos e `.vcd`.
      *(idem)*
- [x] Postgres e Redis nao estao acessiveis pela internet: no compose de
      producao so o Caddy publica porta (80/443) — conferido com
      `docker compose config`.
- [x] O container da API nao tem acesso ao socket do Docker; nem o worker: quem
      fala com o daemon e o `docker-proxy` validador (RNF04-I02), e o worker o
      alcanca por `DOCKER_HOST`.
- [x] Nenhum segredo versionado: `infra/.env` esta no `.gitignore` e o
      repositorio so traz `infra/.env.example`, com os comandos que geram cada
      segredo.
- [ ] O procedimento de deploy esta escrito **(feito: `docs/DEPLOY.md`)** e foi
      executado do zero uma vez *(pendente)*.

## Divergencia da especificacao

- **Proxy reverso**: Caddy, nao nginx. Emite e renova o certificado sozinho, sem
  cron de renovacao nem passo manual de `certbot` — um componente a menos para
  o roteiro explicar e para alguem esquecer de renovar.
- **Socket do Docker**: a issue pede monta-lo no worker. Depois de RNF04-I02 o
  worker tambem nao o monta: quem o toca e o proxy validador, que recusa
  qualquer `create` diferente do que `buildSandboxContainerOptions` monta.

## Verificacao

```bash
curl -i https://<dominio>/health
docker compose -f infra/docker-compose.prod.yml ps
docker compose -f infra/docker-compose.prod.yml logs worker --tail=50
```

## Riscos

- Montar `docker.sock` equivale a dar root na VM ao worker: manter o worker sem
  porta exposta e revisar o hardening junto com RNF04.
- Creditos do Azure sao limitados (~$100 / 2 meses): dimensionar a VM conforme
  `docs/PROJECT_CONTEXT.md` secao 2.6 e desligar fora dos periodos de uso.

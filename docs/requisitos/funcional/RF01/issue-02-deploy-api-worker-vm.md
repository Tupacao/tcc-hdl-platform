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
- [ ] Uma simulacao submetida pela URL publica retorna diagnosticos e `.vcd`.
- [ ] Postgres e Redis nao estao acessiveis pela internet.
- [ ] O container da API nao tem acesso ao socket do Docker; o worker tem.
- [ ] Nenhum segredo versionado; `.env` de producao fica fora do repositorio.
- [ ] O procedimento de deploy esta escrito e foi executado do zero uma vez.

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

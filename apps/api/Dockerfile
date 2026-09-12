# Imagem da API e do worker de simulacao.
# Build a partir da raiz do monorepo: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS base
# libssl exigida pelo engine do Prisma (binaryTarget linux-musl-openssl-3.0.x).
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --no-frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @tplab/api exec prisma generate
RUN pnpm --filter @tplab/shared build && pnpm --filter @tplab/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3333
# So o servico `api` roda migracao no start (RF07-I01); o `worker` sobrescreve
# este CMD por `node dist/worker.js` no docker-compose, sem correr a migracao em dobro.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

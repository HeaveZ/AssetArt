# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# AssetNova / Evam Assets — multi-target production images
#
#   deps     → tüm bağımlılıklar (build için gerekli)
#   builder  → prisma generate + next build → standalone bundle
#   web      → Next.js standalone runtime (ince, sadece app + prisma client)
#   migrator → oneshot prisma migrate deploy (tam prisma CLI + tooling)
#
# Build:
#   docker build --target web      -t ghcr.io/heavez/assetnova-web:vX.Y.Z      .
#   docker build --target migrator -t ghcr.io/heavez/assetnova-migrator:vX.Y.Z .
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20-alpine

# ───────── deps ─────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --node-linker=hoisted

# ───────── builder ─────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9 --activate

ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production

# Build-time dummy env'leri — sadece builder stage'inde, runner image'larına SIZMAZ.
# Runtime'da gerçek .env.production tarafından OVERRIDE edilir.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV AUTH_SECRET="build-time-dummy-not-used-at-runtime"
ENV AUTH_URL="http://localhost"
ENV NEXT_PUBLIC_APP_URL="http://localhost"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate
RUN pnpm build

# ───────── web (final target #1) ─────────
FROM node:${NODE_VERSION} AS web
WORKDIR /app

RUN apk add --no-cache tini openssl libc6-compat \
 && addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# Standalone Next.js: server.js + minimal node_modules (Next.js traced)
COPY --from=builder /app/public                              ./public
COPY --from=builder --chown=app:app /app/.next/standalone    ./
COPY --from=builder --chown=app:app /app/.next/static        ./.next/static

# Prisma client runtime (Next.js trace bazen dynamic require'ları kaçırır,
# açıkça kopyalıyoruz). Migrate web'de yapılmıyor → prisma CLI/config gereksiz.
COPY --from=builder /app/node_modules/.prisma                ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client         ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/@prisma/adapter-pg     ./node_modules/@prisma/adapter-pg

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","server.js"]

# ───────── migrator (final target #2) ─────────
FROM node:${NODE_VERSION} AS migrator
WORKDIR /app

RUN apk add --no-cache tini openssl libc6-compat

ENV NODE_ENV=production

COPY --from=builder /app/prisma                              ./prisma
COPY --from=builder /app/prisma.config.ts                    ./prisma.config.ts
COPY --from=builder /app/package.json                        ./package.json
# Tam node_modules: prisma CLI'ın transitive deps'leri (effect, fast-check, vb.)
COPY --from=builder /app/node_modules                        ./node_modules

RUN printf '#!/bin/sh\nset -e\necho "[migrator] running prisma migrate deploy"\nnode ./node_modules/prisma/build/index.js migrate deploy\necho "[migrator] done"\n' > /entrypoint.sh \
 && chmod +x /entrypoint.sh

ENTRYPOINT ["/sbin/tini","--"]
CMD ["/entrypoint.sh"]

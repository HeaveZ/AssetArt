# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# AssetNova / Evam Assets — production image (Next.js 16 standalone + Prisma 7)
# Multi-stage:
#   deps    → install all deps with pnpm
#   builder → prisma generate + next build → standalone bundle
#   runner  → minimal alpine image, runs migrations then starts server
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
# Hydrate the prisma client and all runtime deps. Use a cache mount for speed.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ───────── builder ─────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9 --activate

ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the Prisma client (offline, no DB connection needed)
RUN pnpm prisma generate

# Build the Next.js app with `output: 'standalone'`
RUN pnpm build

# ───────── runner ─────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

RUN apk add --no-cache tini openssl libc6-compat \
 && addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# Static assets + standalone server output
COPY --from=builder /app/public                                ./public
COPY --from=builder --chown=app:app /app/.next/standalone      ./
COPY --from=builder --chown=app:app /app/.next/static          ./.next/static

# Prisma assets needed at runtime
COPY --from=builder /app/prisma                                ./prisma
COPY --from=builder /app/prisma.config.ts                      ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma                  ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma                  ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma                   ./node_modules/prisma
COPY --from=builder /app/node_modules/dotenv                   ./node_modules/dotenv
COPY --from=builder /app/node_modules/tsx                      ./node_modules/tsx

# Entrypoint runs migrate deploy then starts the server
RUN printf '#!/bin/sh\nset -e\necho "→ Running prisma migrate deploy"\nnode ./node_modules/prisma/build/index.js migrate deploy\necho "→ Starting Next.js on :$PORT"\nexec node server.js\n' > /entrypoint.sh \
 && chmod +x /entrypoint.sh \
 && chown app:app /entrypoint.sh

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["/entrypoint.sh"]

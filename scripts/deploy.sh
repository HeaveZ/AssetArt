#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AssetArt — one-shot deploy script for the Contabo box.
#
# Usage on the server:
#   ./scripts/deploy.sh             # pull, build, migrate, restart
#   ./scripts/deploy.sh --seed      # also run the demo seed (first time only)
#   ./scripts/deploy.sh --no-build  # skip image rebuild
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SEED=false
BUILD=true
for arg in "$@"; do
  case "$arg" in
    --seed)     SEED=true ;;
    --no-build) BUILD=false ;;
    *)          echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

# Sanity checks
if [[ ! -f .env.production ]]; then
  echo "✗ .env.production not found. Copy .env.production.example, fill secrets, then re-run." >&2
  exit 1
fi
command -v docker >/dev/null 2>&1 || { echo "✗ docker is required"; exit 1; }

echo "→ Pulling latest from origin"
git pull --ff-only origin main

if [[ "$BUILD" == "true" ]]; then
  echo "→ Building production image"
  docker compose -f deploy/docker-compose.prod.yml build app
fi

echo "→ Starting database"
docker compose -f deploy/docker-compose.prod.yml up -d postgres

echo "→ Waiting for postgres to be healthy"
for i in $(seq 1 30); do
  if docker compose -f deploy/docker-compose.prod.yml exec -T postgres pg_isready -U "${POSTGRES_USER:-assetart}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "→ Starting application (entrypoint runs migrate deploy)"
docker compose -f deploy/docker-compose.prod.yml up -d app

if [[ "$SEED" == "true" ]]; then
  echo "→ Seeding demo data"
  docker compose -f deploy/docker-compose.prod.yml exec -T app sh -c "node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts"
fi

echo
echo "✓ Deploy complete."
docker compose -f deploy/docker-compose.prod.yml ps

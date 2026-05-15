# AssetNova · Evam Assets

**Enterprise asset intelligence for modern IT teams.** Track every device, license, and lease in one calm command center — built with Next.js 16, Prisma 7, and Tailwind v4. Visual language: Linear/Notion/Vercel — premium-restrained.

---

## What's inside

| Layer            | Choice                                                        |
| ---------------- | ------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, RSC, Server Actions, Turbopack)       |
| Language         | TypeScript strict + `noUncheckedIndexedAccess`                |
| UI               | shadcn/ui + Radix · Tailwind CSS v4 · `motion` animations     |
| Forms            | react-hook-form + zod                                         |
| Tables           | TanStack Table v8 with `nuqs` URL-synced filters              |
| Database         | PostgreSQL 16                                                 |
| ORM              | Prisma 7 with `@prisma/adapter-pg`                            |
| Auth             | Auth.js v5 (Credentials + optional Resend Magic Link, JWT)    |
| Excel / PDF      | exceljs · `@react-pdf/renderer` (M10)                         |
| Charts           | Recharts                                                      |
| Premium add-ons  | AI auto-categorization · QR labels + scan · Floor map editor  |

Brand tokens live in `src/app/globals.css` (light + dark). The codebase is split into three layers — `src/frontend/`, `src/backend/`, and `src/shared/` — with strict one-way dependencies. See [`docs/architecture.md`](./docs/architecture.md) for the full layout and the rules for adding a new domain.

---

## Local development

Prerequisites: Node ≥ 20, pnpm ≥ 9, Docker.

```bash
# 1. Install deps
pnpm install

# 2. Boot Postgres + MailHog
pnpm db:up

# 3. Create the schema (first time only)
pnpm prisma migrate dev --name init

# 4. Seed demo data (idempotent — wipes and refills)
pnpm db:seed

# 5. Run the dev server
pnpm dev
```

Open `http://localhost:3000` and sign in as `ibrahim@evam.com`. The password is whatever you set as `SEED_DEFAULT_PASSWORD` in `.env.local` before running `pnpm db:seed` — it's never committed to the repo.

MailHog UI: `http://localhost:8025` (catches Magic Link emails locally).

---

## Production deploy (Contabo VPS with Docker)

The image is a self-contained Next.js 16 standalone server that runs Prisma migrations on startup. The `deploy/docker-compose.prod.yml` brings up Postgres + the app, with an optional Caddy profile for automatic Let's Encrypt SSL.

### One-time setup on the server

```bash
# As a non-root user on the Contabo box
git clone https://github.com/HeaveZ/AssetNova.git
cd AssetNova

# Copy the secrets template and fill in real values:
cp .env.production.example .env.production
# Generate AUTH_SECRET with: openssl rand -base64 32
nano .env.production
```

### Deploy / redeploy

```bash
./scripts/deploy.sh            # pull, build, migrate, restart
./scripts/deploy.sh --seed     # first time only: populates demo data
./scripts/deploy.sh --no-build # restart only (skip rebuild)
```

### Putting it behind HTTPS

Pick one:

**A. Host-level nginx + Let's Encrypt** (recommended for Contabo VPS)

```bash
# As root on the server, after the app is running on :3000
sudo ./deploy/nginx/setup.sh assets.evam.com ops@evam.com
```

The script installs `nginx` + `certbot`, drops in `deploy/nginx/nginx.conf` (rate limiting, HSTS, gzip, websocket upgrade, long cache for `_next/static`), gets a Let's Encrypt certificate via the http-01 challenge, and reloads. Renewal is automatic via `certbot.timer`.

**B. Built-in Caddy (in-compose)** — zero config, automatic SSL but adds an extra container:

```bash
# Edit deploy/Caddyfile and replace assets.yourdomain.com
docker compose -f deploy/docker-compose.prod.yml --profile caddy up -d
```

**C. Your own proxy** — point Traefik / Cloudflare Tunnel / existing nginx at `127.0.0.1:3000`.

### Health & logs

```bash
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs -f app
curl http://localhost:3000/api/health
```

---

## Build status (milestone tracker)

| #   | Milestone                                          | Status |
| --- | -------------------------------------------------- | ------ |
| M0  | Foundation (configs, schema, primitives)           | ✅     |
| M1  | Auth + protected shell (sidebar / top bar / Cmd+K) | ✅     |
| M2  | Dashboard (KPIs, recents, activity, alerts, charts)| ✅     |
| M3  | Assets read (table, filters, detail, Excel)        | ✅     |
| M4  | Assets write (multi-step form, AI auto-fill, CSV)  | ⏳     |
| M5  | Checkout / check-in                                | ⏳     |
| M6  | Maintenance                                        | ⏳     |
| M7  | Leases · Licenses                                  | ⏳     |
| M8  | Alerts inbox · Activity audit log                  | ⏳     |
| M9  | Settings · custom fields                           | ⏳     |
| M10 | Reports (Excel + PDF)                              | ⏳     |
| M11 | Polish (dark mode, CSV validator, mobile)          | ⏳     |
| M12 | Tests + CI                                         | partial |
| ★   | Premium · AI categorize · QR · Floor map           | ⏳     |

Saved views (M3) are intentionally deferred to M9 alongside Settings.

---

## Tech notes

- **Prisma 7** drops `url` from `datasource db {}` — connection URLs live in `prisma.config.ts`. The runtime client uses `@prisma/adapter-pg` (no rust query engine binary needed).
- **Auth.js v5** is split into an edge-safe `src/auth.config.ts` (used by `proxy.ts`) and a Node-runtime `src/auth.ts` with the Prisma adapter + bcryptjs.
- **Tailwind v4** uses `@theme {}` for design tokens. No `tailwind.config.ts` content is required for tokens; only `globals.css`.
- **`output: "standalone"`** on Next.js produces a slim Docker image with just the deps actually traced through the build.

See `docs/decisions.md` for the full architecture decision log.

---

## License

Proprietary — © Evam Tech. All rights reserved.

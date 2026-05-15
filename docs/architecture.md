# Architecture

AssetArt is a single Next.js 16 application with strict internal boundaries between **frontend**, **backend**, and **shared** code. Each top-level folder under `src/` has one purpose, and dependencies only point inward (frontend → shared, backend → shared, but never frontend → backend internals).

```
src/
├── app/                        # Next.js routes — pages, layouts, route handlers
│   ├── (auth)/                 # Public route group: login + register
│   ├── (app)/                  # Protected route group: every authenticated view
│   ├── api/
│   │   ├── auth/[...nextauth]/ # Auth.js HTTP handler
│   │   └── health/             # Docker / nginx healthcheck
│   ├── globals.css             # Design tokens (light + dark) + animations
│   ├── layout.tsx              # Root layout · Inter + JetBrains Mono · providers
│   └── page.tsx                # `/` → redirect to /dashboard
│
├── frontend/                   # Client-facing code — UI, hooks, UI utilities
│   ├── components/
│   │   ├── ui/                 # shadcn / Radix primitives (button, dialog, …)
│   │   └── app/                # Composite app components (sidebar, top bar, …)
│   ├── providers/              # Client context providers (theme, nuqs)
│   └── lib/                    # UI-only helpers (cn, avatar palette, navigation tree)
│
├── backend/                    # Server-only code — database, services, actions
│   ├── db.ts                   # Prisma client (singleton)
│   ├── session.ts              # `getActiveSession` / `requireSession`
│   ├── actions/                # Next.js Server Actions (one file per domain)
│   └── services/               # Pure business logic, no Next.js imports
│
├── shared/                     # Used by both layers — typed contracts
│   ├── schemas/                # Zod schemas (auth, asset, …) for form + server
│   ├── types/                  # TS types · next-auth module augmentation
│   ├── constants.ts            # Status meta, role meta, alert meta
│   ├── format.ts               # Money / date / file-size formatters (Intl)
│   └── permissions.ts          # Permission matrix + `requirePermission`
│
├── auth.ts                     # Auth.js v5 Node entrypoint (uses Prisma + bcrypt)
├── auth.config.ts              # Edge-safe Auth.js config (used by proxy.ts)
└── proxy.ts                    # Next.js 16 "proxy" (was middleware in 15)
```

## Single-responsibility rules

| File pattern                            | Responsibility                                                          |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `app/**/page.tsx`                       | Render a route. Data is fetched from a server action or service.        |
| `app/**/layout.tsx`                     | Wrap children. Pull session, set providers. No business logic.          |
| `frontend/components/ui/*`              | One Radix primitive. Tiny surface, no app knowledge.                    |
| `frontend/components/app/<domain>/*`    | One composite for a single domain (assets, dashboard, auth, …).         |
| `frontend/lib/utils.ts`                 | `cn`, `initials`, `avatarColor` — pure UI utilities, no React state.    |
| `frontend/providers/*`                  | Wrap children with a single context (theme, nuqs).                      |
| `backend/db.ts`                         | Singleton Prisma client. Nothing else.                                  |
| `backend/session.ts`                    | Resolve current session + typed errors.                                 |
| `backend/actions/<domain>.ts`           | `"use server"` mutations for one domain (auth, assets, …).              |
| `backend/services/<domain>.ts`          | Pure logic & queries for one domain. Importable from actions + pages.   |
| `shared/schemas/<domain>.ts`            | One Zod schema per domain. Source of truth for both form + server.      |
| `shared/permissions.ts`                 | Permission matrix. Used by every server action.                         |

## Dependency direction

```
   app/  ─────────────► frontend/  ────────► shared/
         │
         └────────────► backend/   ────────► shared/
```

- Pages (RSC, in `src/app/`) may import from `backend/services/*` directly (they run on the server).
- Client components (`"use client"`) must only call backend through **server actions** in `backend/actions/*` — never import services or `backend/db.ts` directly, or the bundler will try to ship Prisma to the browser.
- Nothing in `shared/` may import from `frontend/` or `backend/`. Keep it pure types and isomorphic helpers.

## Why this shape

- **`output: "standalone"`** in `next.config.ts` lets Next.js statically trace the dependency graph; the boundary above keeps server-only code (Prisma, bcrypt, exceljs) out of the client bundle.
- **`@/shared`** is the *only* place a contract should live. Adding a status to `AssetStatus` requires touching `prisma/schema.prisma` + `shared/constants.ts` + `shared/schemas/asset.ts` — and nothing else.
- **Two auth files** (`auth.ts` + `auth.config.ts`) are required because Auth.js v5's edge-runtime middleware can't import Prisma or bcrypt. The split is the official pattern.

## Adding a new domain (example: "vendors")

1. `prisma/schema.prisma` → add `Vendor` model, run `pnpm prisma migrate dev`.
2. `src/shared/schemas/vendor.ts` → Zod input/filter schemas.
3. `src/shared/constants.ts` → any status meta if needed.
4. `src/shared/permissions.ts` → add `"vendor.create"`, `"vendor.update"`, etc.
5. `src/backend/services/vendors.ts` → queries.
6. `src/backend/actions/vendors.ts` → `createVendorAction`, `updateVendorAction`.
7. `src/frontend/components/app/vendors/*` → list, form, detail UI.
8. `src/app/(app)/vendors/page.tsx` → the route, calls `listVendors` from the service.
9. Add to `src/frontend/lib/navigation.ts` so the sidebar picks it up.

That's it — one move per layer, none of the other domains have to change.

# Decisions log — Evam Assets

> Append-only record of product/architecture choices that deviate from or extend the spec in `CLAUDE_CODE_PROMPT.md`. Newest at top.

## 2026-05-15 — Foundation kickoff

### D-001 Project name
- Spec uses `evam-assets` for the package name. Repo on disk is already `assetnora` (the user's earlier `pnpm create next-app` choice). Keep `package.json#name = "assetnora"` (matches the working directory) but UI strings + brand stay **Evam Assets**.

### D-002 Versions
- Use installed: Next **16**, Prisma **7**, React **19**, Tailwind **v4**, Auth.js **v5-beta**.
- Spec said Next 15 / Prisma 5; we don't downgrade — APIs we rely on (App Router, Server Actions, RSC) are stable across these majors.

### D-003 Postgres port
- Local Postgres in docker-compose uses host port **5433** (not the default 5432) to avoid colliding with any system Postgres the user may already run.

### D-004 AuditLog model
- Spec proposed a direct `Asset @relation(fields:[resourceId], references:[id])` back-link on `AuditLog`. That conflicts with the polymorphic `resourceType+resourceId` design (resourceId may also point at Lease, Maintenance, Alert).
- **Decision:** drop the Prisma relation. Keep `resourceType` + `resourceId` + composite index. Joins happen at query time in `src/server/services/audit.ts`.

### D-005 Auth.js v5 adapter tables
- Added `Account`, `Session`, `VerificationToken` (Auth.js spec). Strategy stays **JWT** so `Session` is unused for Credentials, but the table exists for forward compat with future OAuth providers.

### D-006 Pre-modeled extensions
- Added now (not in spec): `License`, `SavedView`, `CustomFieldDefinition`, `FloorPlan`, `FloorPlanPin`, `CommandLog`. Required by milestones M3 / M9 / M10 and the premium features the user approved.

### D-007 Premium features (user-approved 2026-05-15)
- **AI auto-categorization** (Claude API) — endpoint at `src/server/services/ai-categorize.ts`, model `claude-sonnet-4-6`. Triggered from new-asset form button.
- **QR/Barcode** — `qrcode` for generation, `BarcodeDetector` API for camera scan with manual fallback.
- **Floor map** — per-Site SVG/PNG upload, draggable pins (HTML5 drag + react-resizable-panels). Stored in `FloorPlan` / `FloorPlanPin`.

### D-008 Cmd+K = product center
- Spec showed Cmd+K as search + scan placeholder. User-approved upgrade to Linear-level command center: every primary action runs from Cmd+K (navigation, asset search, new asset, checkout, checkin, export, theme toggle, AI commands). Grouped sections, recent history from `CommandLog` table.

### D-009 Motion library
- Adding `motion` (formerly framer-motion) for layout animations, count-up KPIs, page transitions. `tw-animate-css` handles simple primitive states. Spec didn't list a motion library; this is consistent with the user's "animated + detailed professional" direction.

### D-010 Default workspace timezone
- Spec mentioned "default `Europe/Istanbul`". Set on `Workspace.timezone` column with that default. Display dates use this via `Intl.DateTimeFormat` in `src/lib/format.ts`.

### D-011 Currency default
- `Workspace.currency = "USD"` per spec hint. Per-asset/per-lease currency can override.

### D-012 Soft delete
- `deletedAt` column on `User` and `Asset`. Service layer queries always filter `deletedAt: null` unless explicitly opted out.

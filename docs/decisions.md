# Decisions log — Evam Assets

> Append-only record of product/architecture choices that deviate from or extend the spec in `CLAUDE_CODE_PROMPT.md`. Newest at top.

## 2026-05-15 — M4 assets write + AI auto-fill

### D-013 Multi-step form architecture
- One `useForm` instance with the master `createAssetSchema`. Per-step validation runs via `form.trigger(STEP_FIELDS[index])` before moving forward. Schemas (`assetBasicsSchema` / `assetSpecsSchema` / `assetAssignmentSchema`) were already split — we reuse them via the master composition without re-defining sub-forms.
- Resolver is cast to `Resolver<CreateAssetInput>` because zod's `.default()` makes input/output types diverge. The cast is local to `asset-form.tsx`; everywhere else (action input, child components) uses the output type for clarity.

### D-014 Photo step deferred
- Step 4 (Photos) renders a placeholder card until UploadThing is wired in M11. The form values for other steps are preserved when the user clicks Next from this step.

### D-015 Date inputs
- Native `<input type="date">` instead of `react-day-picker` for now. Cheap, accessible, works in all target browsers. Premium calendar picker can replace it in M11 polish.

### D-016 AI auto-categorize endpoint
- `backend/services/ai-categorize.ts` hits `claude-sonnet-4-6` via `@anthropic-ai/sdk`. System prompt is `cache_control: ephemeral` so repeat calls in a session hit the prompt cache (90% discount per Anthropic).
- The model is asked to return ONLY JSON (no fence). We strip fences defensively and validate against `aiCategorizeResultSchema`. On any failure we degrade to `{ confidence: 0 }` and report a toast to the user instead of crashing the form.
- If `ANTHROPIC_API_KEY` is missing the action returns a typed `AiNotConfiguredError` with a clear "set ANTHROPIC_API_KEY" message instead of failing silently.

### D-017 CSV import behavior
- Lookup maps (sites, categories, users) are fetched once per import, then resolved by lowercased name (or email for assignees). Unknown references just drop the field — the row still imports.
- Each invalid row produces a `{ row, tag?, reason }` entry so the UI can show actionable errors. The whole import runs inside a single Prisma `$transaction`, but each row's failure does not abort the others — we collect errors and continue. The audit log entries for successful rows are inserted via a single `createMany` at the end of the tx.
- Max upload is 5 MB. Full row-level UI validator + dry-run preview is deferred to M11.

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

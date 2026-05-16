# AssetArt Platform Expansion — Design Spec

**Date:** 2026-05-16
**Owner:** Ibrahim Bekar
**Status:** Approved, in implementation

## Goal

Bring AssetArt to feature parity with the AssetTiger reference (the user provided
screenshots for: rich assets table, user dropdown, Help/Support hub, Reports center,
sidebar structure) — but with AssetArt's own visual identity (navy + orange palette,
hairline borders, motion-driven micro-interactions) and a cleaner data model
(category-aware specs, no globally-shared columns).

Non-goals: mobile responsive overhaul, xlsx export upgrade (CSV stays), Stripe
integration (subscription page is a stub).

## Scope (5 parts)

### Part 1 — Rich Asset Table

The existing `Assets` page (`src/app/(app)/assets/page.tsx`) uses a TanStack
table with filters, sort, column visibility, paginator, multi-select. The schema
**already exposes** the data we need (`Asset.brand`, `model`, `serialNumber`,
`cpu`, `memoryGB`, `storageGB`, `displayInches`, `os`, `description`,
`purchaseDate`, `assignee`, `category`); the projection in
`listAssets` returns most of it. So this is purely a presentation upgrade
plus a new column-preferences mechanism.

**Changes**

- `AssetListRow` (in `backend/services/assets.ts`) — extend the projection to
  also include `cpu`, `displayInches`, `os`, `description` so the table can
  render them. No DB migration.
- `asset-table-columns.tsx` — add columns: `brand`, `model`, `serialNumber`,
  `purchaseDate`, `cpu`, `memoryGB`, `storageGB`, `displayInches`, `os`,
  `description`, `action`. Existing `tag`, `name`, `category`, `site`,
  `assignee`, `status`, `value`, `created` stay.
- `ColumnPickerSheet` — new sheet component replacing the inline dropdown.
  Drag-to-reorder columns, persist to `SavedView` (resource = `ASSET`,
  ownerId = current user). When opening the page, load the user's most recent
  SavedView for assets and apply its `columns` array as both order and
  visibility.
- `AssetFiltersSheet` — rename trigger to **Search Criteria**, expand fields:
  brand, model, serial number contains, purchase date range, has serial,
  custom-fields (later). Keep nuqs query-state pattern.
- `AssetTable` — add page-size selector (10/25/50/100) wired through nuqs.
  Replace `{total} assets · page X of N` with
  `Showing X to Y of Z records · page X of N` to match the reference flow.

**Persistence rules**
- Column visibility/order is per-user (SavedView with ownerId).
- We do NOT auto-create SavedView on first visit; defer creation until the
  user explicitly clicks "Save layout" inside the picker — this avoids a row
  per user-first-render and keeps Settings → Saved Views readable.

**Security**
- All projection fields are workspace-scoped already (`workspaceId` is the
  first `where` predicate). No change.
- SavedView mutations require session; ownerId is enforced server-side, never
  trusted from input.
- Drag-reorder happens client-side; the persisted payload is a string array
  of column ids — validated with Zod against the known column set so a
  tampered SavedView can't inject arbitrary fields.

### Part 2 — User Dropdown (top-right)

Today the user menu lives in the sidebar bottom. Move it to the top-right
of `TopBar` (AssetTiger pattern) with the items: My Profile, Change Password,
Account Details, Subscription Plans, Sign out.

**New routes**

- `/settings/profile` — name + avatar (server action `updateProfileAction`).
- `/settings/password` — current / new / confirm. Server action
  `changePasswordAction` re-verifies `bcrypt.compare(current, user.passwordHash)`
  before hashing the new one with cost 12. Returns generic errors (no enumeration).
- `/settings/account` — read-only: workspace, role, member-since, last login.
- `/settings/billing` — premium plan cards (Free / Pro / Enterprise) with
  "Current" badge on Free. Pure UI for now; no real billing.
- The legacy `/settings` landing keeps its grid — these new pages slot under it.

**TopBar component changes**
- New `UserMenu` client component using `DropdownMenu` primitive from `ui/`.
- Sidebar's bottom user card stays (still useful for collapsed sidebar
  reachability) but its menu items are simplified to {Profile, Sign out}
  to avoid two menus drifting.

**Security**
- Password change action: rate-limit-not-implemented but use generic errors,
  re-hash with cost 12, and invalidate other sessions by bumping `updatedAt`
  (Auth.js session will refresh on next read).
- Server action validates input with a new `changePasswordSchema` using the
  existing `passwordSchema` for the new password.
- No reading or returning the old hash.

### Part 3 — Help / Support hub

New top-level `/help` section with sub-routes:

- `/help` — landing grid with cards for each sub-page.
- `/help/about` — what AssetArt is, our positioning.
- `/help/contact` — support email + form (client-side only, mailto fallback —
  no SMTP wiring needed for parity).
- `/help/terms` — placeholder Terms of Service text (clearly marked).
- `/help/privacy` — placeholder Privacy Policy.
- `/help/videos` — empty-state "Coming soon" with placeholder cards.
- `/help/reviews` — testimonials placeholder.
- `/help/accessibility` — WCAG statement boilerplate.
- `/help/changelog` — version log; seed with the rebrand entry + a couple
  feature ships pulled from `git log`.

These pages do NOT need DB calls. They're server components rendering markdown-
shaped content from local TS constants — easy to edit later.

### Part 4 — Reports Center

Replace the placeholder `/reports` page with a real hub.

- `/reports` — grid of 11 category cards: Automated, Custom, Asset, Audit,
  Check-Out, Contract, Leased Asset, Maintenance, Reservation, Status,
  Transaction, Other.
- Implemented (read real data):
  - `/reports/asset-inventory` — full asset register; reuses `listAssets`,
    renders a print-friendly table.
  - `/reports/status` — count by status; horizontal bar chart + table.
  - `/reports/checkout-active` — currently checked-out items (`Checkout` rows
    with `checkedInAt IS NULL`).
  - `/reports/maintenance-history` — recent `MaintenanceRecord` entries.
  - `/reports/lease-active` — active leases (`Lease.status = ACTIVE` or
    similar predicate — confirm in service).
- Stubs (premium card grid with "Coming soon"):
  - audit, contract, reservation, transaction, custom, automated, other.

**Security**
- All queries workspace-scoped via session.
- No URL params take filter predicates without zod parsing.

### Part 5 — Sidebar refinement

- Add "Help" link to nav.
- Simplify sidebar user card (since top-bar has the full menu).
- Keep brand logo + workspace switcher untouched (per the user's earlier
  decision: top label stays the fixed brand).

## Design language

- Surface tones: existing `bg-surface`, `border-subtle`, `bg-surface-muted`.
- Accent: `brand-orange-500` for primary, with `0.16 → 0.04 → transparent`
  gradient washes on active rows (already established).
- Status pills: keep the existing `AssetStatusBadge` color tokens.
- Hairline borders (`border-white/[0.06]` in dark contexts) — no heavy
  table strokes.
- Motion: keep the `motion/react` row-stagger pattern (12-step delay cap).
- Typography: tabular-nums for any numeric columns; `text-[12.5px]` for
  body cells.

## Build order

1. Spec (this doc) ← committed first.
2. Part 1 (table) — biggest surface, deepest value.
3. Part 2 (user dropdown + 4 settings pages).
4. Part 4 (reports).
5. Part 3 (help static content).
6. Part 5 (sidebar polish + nav additions).
7. Final typecheck pass + dev smoke.

## Out of scope

- Drag-resize column widths.
- Saved view sharing across users (`SavedView.isShared` exists but not used here).
- Real Stripe billing.
- xlsx export upgrade.
- Mobile-first table redesign.
- i18n.

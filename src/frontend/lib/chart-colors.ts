import type { AssetStatus } from "@prisma/client";

/**
 * Chart palettes — kept separate from `shared/constants` because these are
 * presentation-only (Recharts fills). UI badges use Tailwind classes that
 * already encode the same colors via CSS tokens; charts need raw CSS-var refs.
 */

export const STATUS_CHART_COLOR: Record<AssetStatus, string> = {
  AVAILABLE: "var(--color-status-available-fg)",
  CHECKED_OUT: "var(--color-status-checked-out-fg)",
  IN_MAINTENANCE: "var(--color-status-maintenance-fg)",
  RESERVED: "var(--color-status-reserved-fg)",
  LEASED: "var(--color-status-leased-fg)",
  DISPOSED: "var(--color-status-disposed-fg)",
  LOST: "var(--color-status-lost-fg)",
};

/** Stable order for category donuts — picks cycle on overflow. */
export const CATEGORY_PALETTE = [
  "#F5933E",
  "#0F3460",
  "#7B5DCC",
  "#2C9E94",
  "#D26BA1",
  "#3A7BD5",
  "#D89635",
] as const;

/** Shared Recharts tooltip styling. */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--color-surface-elevated)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "var(--color-text-muted)", fontSize: 11 },
} as const;

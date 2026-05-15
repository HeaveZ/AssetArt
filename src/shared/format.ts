import {
  format as fmt,
  formatDistanceToNow as distanceToNow,
  formatRelative as relative,
  isToday,
  isYesterday,
} from "date-fns";

type Numeric = number | string | bigint | { toString(): string };

const toNumber = (value: Numeric): number => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number(value.toString());
};

/* ───────── Money ───────── */
export function formatMoney(
  value: Numeric | null | undefined,
  currency = "USD",
  locale = "en-US",
): string {
  if (value == null) return "—";
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2,
  }).format(n);
}

export function formatCompactMoney(
  value: Numeric | null | undefined,
  currency = "USD",
  locale = "en-US",
): string {
  if (value == null) return "—";
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/* ───────── Numbers ───────── */
export function formatNumber(value: Numeric | null | undefined, locale = "en-US"): string {
  if (value == null) return "—";
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale).format(n);
}

export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 0,
  locale = "en-US",
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/* ───────── Dates ───────── */
export function formatDate(value: Date | string | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return fmt(d, pattern);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return fmt(d, "MMM d, yyyy · HH:mm");
}

export function formatRelative(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  if (isToday(d)) return `Today · ${fmt(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday · ${fmt(d, "HH:mm")}`;
  return relative(d, new Date());
}

export function timeAgo(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${distanceToNow(d, { addSuffix: true })}`;
}

/* ───────── File sizes ───────── */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/* ───────── Truncate ───────── */
export function truncate(value: string | null | undefined, max = 40): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/* ───────── Storage / memory specs ───────── */
export function formatSpec(memoryGB: number | null, storageGB: number | null): string | null {
  const parts: string[] = [];
  if (memoryGB) parts.push(`${memoryGB} GB RAM`);
  if (storageGB) parts.push(`${storageGB >= 1000 ? `${storageGB / 1000} TB` : `${storageGB} GB`} SSD`);
  return parts.length ? parts.join(" · ") : null;
}

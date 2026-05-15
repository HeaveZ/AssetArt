import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic 0..n-1 hash for a string — used for avatar colors. */
export function hashString(input: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % mod;
}

/** Sleep helper for animations / staged operations. */
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Two-character initials, uppercase. */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

/** Avatar color picker (8-stop palette mapped from hash). */
export const AVATAR_PALETTE = [
  "var(--color-avatar-purple)",
  "var(--color-avatar-pink)",
  "var(--color-avatar-teal)",
  "var(--color-avatar-coral)",
  "var(--color-avatar-blue)",
  "var(--color-avatar-green)",
  "var(--color-avatar-amber)",
  "var(--color-avatar-navy)",
] as const;

export function avatarColor(seed: string): string {
  return AVATAR_PALETTE[hashString(seed, AVATAR_PALETTE.length)] ?? AVATAR_PALETTE[0]!;
}

/** Typed deep-equal for primitive-safe comparisons. */
export function isShallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

/** Clamp a number to a range. */
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

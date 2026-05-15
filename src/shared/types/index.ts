export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export type Tone = "info" | "success" | "warning" | "danger" | "muted" | "neutral";

export type SortDir = "asc" | "desc";

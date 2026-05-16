import "server-only";

/**
 * Parse a small CSV string into an array of typed records.
 * Handles:
 *   - Quoted fields (`"foo, bar"`)
 *   - Escaped double-quotes inside quoted fields (`""`)
 *   - Leading BOM (UTF-8)
 *   - CRLF or LF line endings
 *   - Trailing/leading whitespace around fields
 *
 * Returns `{ headers, rows }`. `rows[i]` is keyed by header.
 * Empty lines are skipped.
 */
// Handles a single character while inside quoted state.
// Returns the next state. `consumedExtra` signals a peek-ahead consumption
// (escaped `""`), so the outer loop must advance the index by one more.
type QuotedStep = { field: string; inQuotes: boolean; consumedExtra: boolean };
function stepInsideQuotes(ch: string, next: string | undefined, field: string): QuotedStep {
  if (ch !== '"') return { field: field + ch, inQuotes: true, consumedExtra: false };
  if (next === '"') return { field: field + '"', inQuotes: true, consumedExtra: true };
  return { field, inQuotes: false, consumedExtra: false };
}

function pushLine(lines: string[][], current: string[], field: string): string[] {
  current.push(field);
  if (current.some((f) => f.length > 0)) lines.push(current);
  return [];
}

function tokenizeCsv(text: string): string[][] {
  const cleaned = text.replace(/^﻿/, "");
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]!;
    if (inQuotes) {
      const step = stepInsideQuotes(ch, cleaned[i + 1], field);
      field = step.field;
      inQuotes = step.inQuotes;
      if (step.consumedExtra) i++;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { current.push(field); field = ""; continue; }
    if (ch === "\r") continue;
    if (ch === "\n") {
      current = pushLine(lines, current, field);
      field = "";
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || current.length > 0) {
    pushLine(lines, current, field);
  }
  return lines;
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = tokenizeCsv(text);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0]!.map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r]!;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? "").trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}

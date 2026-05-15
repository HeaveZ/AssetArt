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
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/^﻿/, "");
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      current.push(field);
      field = "";
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      current.push(field);
      field = "";
      if (current.some((f) => f.length > 0)) lines.push(current);
      current = [];
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    if (current.some((f) => f.length > 0)) lines.push(current);
  }

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

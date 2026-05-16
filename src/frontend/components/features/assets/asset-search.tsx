"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Input } from "@/frontend/components/ui/input";

export function AssetSearch() {
  const [q, setQ] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false }),
  );

  // `draft` is null whenever the URL is the source of truth (page load, back/forward).
  // Once the user types, draft takes over until it's flushed to the URL.
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? q;

  // Reset draft if the URL `q` changes externally (e.g. nav back).
  const lastQRef = useRef(q);
  useEffect(() => {
    if (lastQRef.current !== q) {
      lastQRef.current = q;
      setDraft(null);
    }
  }, [q]);

  // Debounce the draft → URL flush.
  useEffect(() => {
    if (draft === null) return;
    const t = setTimeout(() => {
      setQ(draft || null).catch(() => {});
      setDraft(null);
    }, 280);
    return () => clearTimeout(t);
  }, [draft, setQ]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="text-text-subtle pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search tag, name, brand, serial…"
        className="pl-8 pr-8"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label="Clear search"
          className="text-text-subtle hover:bg-surface-muted absolute right-1 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

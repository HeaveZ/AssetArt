"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Input } from "@/frontend/components/ui/input";

export function AssetSearch() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ shallow: false }));
  const [value, setValue] = useState(q);

  useEffect(() => setValue(q), [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (value !== q) {
        void setQ(value || null);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [value, q, setQ]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="text-text-subtle pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
      <Input
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tag, name, brand, serial…"
        className="pl-8 pr-8"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="text-text-subtle hover:bg-surface-muted absolute right-1 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

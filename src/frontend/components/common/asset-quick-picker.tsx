"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

export interface AssetOption {
  id: string;
  tag: string;
  name: string;
}

interface Props {
  assets: AssetOption[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  emptyHint?: string;
  maxItems?: number;
  placeholder?: string;
}

/**
 * Compact "type to filter, click to pick one asset" used inside the
 * maintenance and lease form dialogs. Single-select. For multi-select with
 * status badges and assignee chips see `features/checkouts/asset-picker`.
 */
export function AssetQuickPicker({
  assets,
  value,
  onChange,
  label = "Asset",
  emptyHint = "No matches.",
  maxItems = 50,
  placeholder = "Search by tag or name…",
}: Props) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query).trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!deferred) return assets.slice(0, maxItems);
    return assets
      .filter((a) => `${a.tag} ${a.name}`.toLowerCase().includes(deferred))
      .slice(0, maxItems);
  }, [assets, deferred, maxItems]);

  return (
    <div>
      <Label className="mb-1 text-[11.5px]">{label}</Label>
      <div className="relative">
        <Search className="text-text-subtle pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 pl-8 text-[12.5px]"
        />
      </div>
      <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border">
        {filtered.length === 0 ? (
          <p className="text-text-muted px-3 py-3 text-center text-[12px]">{emptyHint}</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {filtered.map((a) => {
              const selected = value === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onChange(a.id)}
                    className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
                      selected
                        ? "bg-brand-orange-500/5 text-text"
                        : "hover:bg-surface-muted/60 text-text-muted"
                    }`}
                  >
                    <span className="asset-tag text-[11px]">{a.tag}</span>
                    <span className="truncate">{a.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

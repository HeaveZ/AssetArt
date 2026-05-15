"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { AssetStatusBadge } from "@/frontend/components/common/status-badge";
import { cn } from "@/frontend/lib/utils";
import type { AssetPickRow } from "@/backend/services/checkouts";

interface Props {
  assets: AssetPickRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  emptyHint?: string;
}

export function AssetPicker({ assets, selected, onToggle, onSelectAll, emptyHint }: Props) {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return assets;
    return assets.filter((a) =>
      [a.tag, a.name, a.brand, a.model].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [assets, q]);

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2.5">
        <div className="relative">
          <Search className="text-text-subtle pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by tag, name, brand…"
            className="h-8 pl-8 text-[12.5px]"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11.5px]">
          <span className="text-text-muted">
            <span className="text-text font-medium">{filtered.length}</span> asset
            {filtered.length === 1 ? "" : "s"}
            {selected.size > 0 ? (
              <>
                {" · "}
                <span className="text-brand-orange-600 font-medium">{selected.size} selected</span>
              </>
            ) : null}
          </span>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() => onSelectAll(allSelected ? [] : filtered.map((a) => a.id))}
            className="text-text-muted hover:text-text disabled:opacity-50 text-[11px]"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-text-muted px-6 py-16 text-center text-[12.5px]">
            {emptyHint ?? "No matching assets."}
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {filtered.map((a) => {
              const checked = selected.has(a.id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(a.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      checked ? "bg-brand-orange-500/5" : "hover:bg-surface-muted/60",
                    )}
                  >
                    <Checkbox checked={checked} className="pointer-events-none" tabIndex={-1} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="asset-tag text-[11.5px] font-medium">{a.tag}</span>
                        <span className="text-text truncate text-[12.5px] font-medium">{a.name}</span>
                      </div>
                      <div className="text-text-subtle mt-0.5 flex items-center gap-1.5 truncate text-[11px]">
                        {[a.brand, a.model].filter(Boolean).join(" · ") || "—"}
                        {a.site ? <span>· {a.site.name}</span> : null}
                        {a.assignee ? (
                          <span>· {a.assignee.name ?? a.assignee.email}</span>
                        ) : null}
                      </div>
                    </div>
                    <AssetStatusBadge status={a.status} size="sm" />
                    {checked ? (
                      <Check className="text-brand-orange-600 h-3.5 w-3.5 shrink-0" />
                    ) : null}
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

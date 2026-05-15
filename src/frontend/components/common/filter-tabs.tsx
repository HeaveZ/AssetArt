"use client";

import { cn } from "@/frontend/lib/utils";

export interface FilterTab<V extends string> {
  value: V;
  label: string;
  count?: number;
}

interface Props<V extends string> {
  tabs: ReadonlyArray<FilterTab<V>>;
  active: V;
  onChange: (next: V) => void;
  className?: string;
}

/**
 * The compact segmented chip-row used to filter list views by status / segment /
 * read-state. Shared across maintenance, leases, alerts to keep visual rhythm
 * and avoid the same JSX showing up three times.
 */
export function FilterTabs<V extends string>({ tabs, active, onChange, className }: Props<V>) {
  return (
    <div
      className={cn(
        "bg-surface flex flex-wrap items-center gap-1 rounded-lg border p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors",
              isActive
                ? "bg-brand-orange-500/10 text-brand-orange-700"
                : "text-text-muted hover:text-text",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "text-[10.5px]",
                  isActive ? "text-brand-orange-700/80" : "text-text-subtle",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

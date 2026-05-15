"use client";

import { useState } from "react";
import { Filter, RotateCcw, X } from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/frontend/components/ui/sheet";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Label } from "@/frontend/components/ui/label";
import { Separator } from "@/frontend/components/ui/separator";
import { ASSET_STATUS_META } from "@/shared/constants";
import { cn } from "@/frontend/lib/utils";
import type { AssetFacets } from "@/backend/services/assets";

const STATUSES = Object.entries(ASSET_STATUS_META).map(([key, meta]) => ({ key: key as keyof typeof ASSET_STATUS_META, label: meta.label }));

export function AssetFiltersSheet({ facets }: { facets: AssetFacets }) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useQueryStates({
    status: parseAsArrayOf(parseAsString).withDefault([]),
    siteId: parseAsArrayOf(parseAsString).withDefault([]),
    categoryId: parseAsArrayOf(parseAsString).withDefault([]),
    assigneeId: parseAsArrayOf(parseAsString).withDefault([]),
  });

  const activeCount =
    filters.status.length +
    filters.siteId.length +
    filters.categoryId.length +
    filters.assigneeId.length;

  function toggle(key: keyof typeof filters, value: string) {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ [key]: next.length > 0 ? next : null }, { shallow: false });
  }

  function reset() {
    setFilters({ status: null, siteId: null, categoryId: null, assigneeId: null }, { shallow: false });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="md">
          <Filter />
          Filters
          {activeCount > 0 ? (
            <Badge tone="orange" size="sm" className="ml-1">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter assets</SheetTitle>
          <SheetDescription>Narrow the list by status, site, category, or assignee. Settings persist in the URL.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Section title="Status">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(({ key, label }) => {
                const active = filters.status.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle("status", key)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
                      active
                        ? "bg-brand-orange-500 border-brand-orange-600 text-white"
                        : "bg-surface text-text-muted border-border hover:border-border-strong",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Separator />

          <FacetGroup
            title="Site"
            items={facets.sites.map((s) => ({ id: s.id, label: s.name }))}
            selected={filters.siteId}
            onToggle={(id) => toggle("siteId", id)}
          />

          <Separator />

          <FacetGroup
            title="Category"
            items={facets.categories.map((c) => ({ id: c.id, label: c.name }))}
            selected={filters.categoryId}
            onToggle={(id) => toggle("categoryId", id)}
          />

          <Separator />

          <FacetGroup
            title="Assignee"
            items={facets.assignees.map((u) => ({ id: u.id, label: u.name ?? u.email }))}
            selected={filters.assigneeId}
            onToggle={(id) => toggle("assigneeId", id)}
          />
        </div>

        <SheetFooter>
          <Button variant="ghost" size="md" onClick={reset} disabled={activeCount === 0}>
            <RotateCcw />
            Reset
          </Button>
          <Button variant="primary" size="md" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <Label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.06em]">{title}</Label>
      {children}
    </div>
  );
}

function FacetGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Section title={title}>
        <p className="text-text-subtle text-[11.5px]">No {title.toLowerCase()} yet.</p>
      </Section>
    );
  }
  return (
    <Section title={title}>
      <ul className="space-y-1">
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="hover:bg-surface-muted group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors"
              >
                <Checkbox checked={checked} className="pointer-events-none" tabIndex={-1} />
                <span className="text-text flex-1 truncate text-[12.5px]">{item.label}</span>
                {checked ? <X className="text-text-subtle h-3 w-3" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

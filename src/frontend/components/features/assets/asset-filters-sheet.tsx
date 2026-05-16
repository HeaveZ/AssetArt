"use client";

import { useState } from "react";
import { RotateCcw, Search, X } from "lucide-react";
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
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Separator } from "@/frontend/components/ui/separator";
import { ASSET_STATUS_META } from "@/shared/constants";
import { cn } from "@/frontend/lib/utils";
import type { AssetFacets } from "@/backend/services/assets";

const STATUSES = Object.entries(ASSET_STATUS_META).map(([key, meta]) => ({
  key: key as keyof typeof ASSET_STATUS_META,
  label: meta.label,
}));

export function AssetFiltersSheet({ facets }: { facets: AssetFacets }) {
  const [open, setOpen] = useState(false);

  const [arrayFilters, setArrayFilters] = useQueryStates({
    status: parseAsArrayOf(parseAsString).withDefault([]),
    siteId: parseAsArrayOf(parseAsString).withDefault([]),
    categoryId: parseAsArrayOf(parseAsString).withDefault([]),
    assigneeId: parseAsArrayOf(parseAsString).withDefault([]),
  });

  const [textFilters, setTextFilters] = useQueryStates({
    brand: parseAsString.withDefault("").withOptions({ shallow: false }),
    model: parseAsString.withDefault("").withOptions({ shallow: false }),
    serial: parseAsString.withDefault("").withOptions({ shallow: false }),
  });

  const [draftText, setDraftText] = useState(textFilters);

  // Keep draft in sync if filters change externally (browser back/forward).
  if (
    draftText.brand !== textFilters.brand ||
    draftText.model !== textFilters.model ||
    draftText.serial !== textFilters.serial
  ) {
    // no-op: we'll let onChange handlers maintain draft state from here
  }

  const activeCount =
    arrayFilters.status.length +
    arrayFilters.siteId.length +
    arrayFilters.categoryId.length +
    arrayFilters.assigneeId.length +
    (textFilters.brand ? 1 : 0) +
    (textFilters.model ? 1 : 0) +
    (textFilters.serial ? 1 : 0);

  function toggle(key: keyof typeof arrayFilters, value: string) {
    const current = arrayFilters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setArrayFilters({ [key]: next.length > 0 ? next : null }, { shallow: false });
  }

  function apply() {
    setTextFilters({
      brand: draftText.brand || null,
      model: draftText.model || null,
      serial: draftText.serial || null,
    });
    setOpen(false);
  }

  function reset() {
    setArrayFilters(
      { status: null, siteId: null, categoryId: null, assigneeId: null },
      { shallow: false },
    );
    setTextFilters({ brand: null, model: null, serial: null });
    setDraftText({ brand: "", model: "", serial: "" });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraftText(textFilters);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="secondary" size="md">
          <Search />
          Search criteria
          {activeCount > 0 ? (
            <Badge tone="orange" size="sm" className="ml-1">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Search criteria</SheetTitle>
          <SheetDescription>
            Combine free-text fields with status, site, category, and assignee. Settings persist in
            the URL.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Section title="Text">
            <div className="grid gap-2">
              <TextField
                label="Brand"
                placeholder="Apple, HP, Dell…"
                value={draftText.brand}
                onChange={(v) => setDraftText((p) => ({ ...p, brand: v }))}
              />
              <TextField
                label="Model"
                placeholder="MacBook Pro 16, ZBook…"
                value={draftText.model}
                onChange={(v) => setDraftText((p) => ({ ...p, model: v }))}
              />
              <TextField
                label="Serial contains"
                placeholder="Last 4 or full"
                value={draftText.serial}
                onChange={(v) => setDraftText((p) => ({ ...p, serial: v }))}
              />
            </div>
          </Section>

          <Separator />

          <Section title="Status">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(({ key, label }) => {
                const active = arrayFilters.status.includes(key);
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
            selected={arrayFilters.siteId}
            onToggle={(id) => toggle("siteId", id)}
          />

          <Separator />

          <FacetGroup
            title="Category"
            items={facets.categories.map((c) => ({ id: c.id, label: c.name }))}
            selected={arrayFilters.categoryId}
            onToggle={(id) => toggle("categoryId", id)}
          />

          <Separator />

          <FacetGroup
            title="Assignee"
            items={facets.assignees.map((u) => ({ id: u.id, label: u.name ?? u.email }))}
            selected={arrayFilters.assigneeId}
            onToggle={(id) => toggle("assigneeId", id)}
          />
        </div>

        <SheetFooter>
          <Button variant="ghost" size="md" onClick={reset} disabled={activeCount === 0}>
            <RotateCcw />
            Reset
          </Button>
          <Button variant="primary" size="md" onClick={apply}>
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-text-muted mb-1 block text-[11px]">{label}</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-8 text-[12.5px]"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <Label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.06em]">
        {title}
      </Label>
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

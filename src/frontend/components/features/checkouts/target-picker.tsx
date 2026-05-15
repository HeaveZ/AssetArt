"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Building2, Search, User2, Users, Briefcase } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { cn } from "@/frontend/lib/utils";
import type { CheckoutTargetInput } from "@/shared/schemas/checkout";
import type { CheckoutTargetOptions } from "@/backend/services/checkouts";

interface Props {
  options: CheckoutTargetOptions;
  target: CheckoutTargetInput;
  targetId: string | null;
  onChange: (target: CheckoutTargetInput, targetId: string | null) => void;
}

export function TargetPicker({ options, target, targetId, onChange }: Props) {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();

  const filteredUsers = useMemo(
    () => filterByName(options.users, q, (u) => `${u.name ?? ""} ${u.email}`),
    [options.users, q],
  );
  const filteredPeople = useMemo(
    () => filterByName(options.people, q, (p) => `${p.firstName} ${p.lastName} ${p.email ?? ""} ${p.jobTitle ?? ""}`),
    [options.people, q],
  );
  const filteredSites = useMemo(
    () => filterByName(options.sites, q, (s) => s.name),
    [options.sites, q],
  );
  const filteredCustomers = useMemo(
    () => filterByName(options.customers, q, (c) => c.name),
    [options.customers, q],
  );

  return (
    <Tabs
      value={target}
      onValueChange={(v) => onChange(v as CheckoutTargetInput, null)}
      className="flex h-full flex-col"
    >
      <TabsList className="px-3">
        <TabsTrigger value="USER">
          <Users />
          User
        </TabsTrigger>
        <TabsTrigger value="PERSON">
          <User2 />
          Person
        </TabsTrigger>
        <TabsTrigger value="SITE">
          <Building2 />
          Site
        </TabsTrigger>
        <TabsTrigger value="CUSTOMER">
          <Briefcase />
          Customer
        </TabsTrigger>
      </TabsList>

      <div className="border-b px-3 py-2.5">
        <div className="relative">
          <Search className="text-text-subtle pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${target.toLowerCase()}…`}
            className="h-8 pl-8 text-[12.5px]"
          />
        </div>
      </div>

      <TabsContent value="USER" className="flex-1 overflow-y-auto">
        <RadioList<{ id: string; name: string | null; email: string; image: string | null }>
          items={filteredUsers}
          getId={(u) => u.id}
          selectedId={targetId}
          onSelect={(id) => onChange("USER", id)}
          render={(u) => (
            <>
              <UserAvatar name={u.name ?? u.email} src={u.image} size={26} />
              <div className="min-w-0 flex-1">
                <p className="text-text truncate text-[12.5px] font-medium">{u.name ?? u.email}</p>
                <p className="text-text-subtle truncate text-[11px]">{u.email}</p>
              </div>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="PERSON" className="flex-1 overflow-y-auto">
        <RadioList<CheckoutTargetOptions["people"][number]>
          items={filteredPeople}
          getId={(p) => p.id}
          selectedId={targetId}
          onSelect={(id) => onChange("PERSON", id)}
          render={(p) => (
            <>
              <UserAvatar name={`${p.firstName} ${p.lastName}`} src={null} size={26} />
              <div className="min-w-0 flex-1">
                <p className="text-text truncate text-[12.5px] font-medium">
                  {p.firstName} {p.lastName}
                </p>
                <p className="text-text-subtle truncate text-[11px]">
                  {[p.jobTitle, p.email].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="SITE" className="flex-1 overflow-y-auto">
        <RadioList<CheckoutTargetOptions["sites"][number]>
          items={filteredSites}
          getId={(s) => s.id}
          selectedId={targetId}
          onSelect={(id) => onChange("SITE", id)}
          render={(s) => (
            <>
              <span className="bg-surface-muted text-text-subtle inline-flex h-7 w-7 items-center justify-center rounded-md">
                <Building2 className="h-3.5 w-3.5" />
              </span>
              <span className="text-text truncate text-[12.5px] font-medium">{s.name}</span>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="CUSTOMER" className="flex-1 overflow-y-auto">
        <RadioList<CheckoutTargetOptions["customers"][number]>
          items={filteredCustomers}
          getId={(c) => c.id}
          selectedId={targetId}
          onSelect={(id) => onChange("CUSTOMER", id)}
          render={(c) => (
            <>
              <span className="bg-surface-muted text-text-subtle inline-flex h-7 w-7 items-center justify-center rounded-md">
                <Briefcase className="h-3.5 w-3.5" />
              </span>
              <span className="text-text truncate text-[12.5px] font-medium">{c.name}</span>
            </>
          )}
        />
      </TabsContent>
    </Tabs>
  );
}

interface RadioListProps<T> {
  items: T[];
  getId: (item: T) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  render: (item: T) => React.ReactNode;
}

function RadioList<T>({ items, getId, selectedId, onSelect, render }: RadioListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-text-muted px-6 py-12 text-center text-[12.5px]">No matches.</div>
    );
  }
  return (
    <ul className="divide-y divide-border-subtle">
      {items.map((item) => {
        const id = getId(item);
        const selected = id === selectedId;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                selected ? "bg-brand-orange-500/5" : "hover:bg-surface-muted/60",
              )}
            >
              {render(item)}
              {selected ? (
                <span className="bg-brand-orange-500 ml-auto h-1.5 w-1.5 rounded-full" />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function filterByName<T>(items: T[], q: string, get: (item: T) => string): T[] {
  if (!q) return items;
  return items.filter((item) => get(item).toLowerCase().includes(q));
}

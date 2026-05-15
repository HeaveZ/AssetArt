"use client";

import { useFormContext } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { AssetStatusBadge } from "@/frontend/components/app/status-badge";
import { formatDate, formatMoney, formatSpec } from "@/shared/format";
import { type ASSET_STATUS_META } from "@/shared/constants";
import { cn } from "@/frontend/lib/utils";
import type { CreateAssetInput } from "@/shared/schemas/asset";

interface Props {
  categories: { id: string; name: string }[];
  sites: { id: string; name: string }[];
  locations: { id: string; name: string; siteId: string }[];
  assignees: { id: string; name: string | null; email: string }[];
}

export function StepReview({ categories, sites, locations, assignees }: Props) {
  const form = useFormContext<CreateAssetInput>();
  const v = form.getValues();

  const category = v.categoryId ? categories.find((c) => c.id === v.categoryId)?.name : null;
  const site = v.siteId ? sites.find((s) => s.id === v.siteId)?.name : null;
  const location = v.locationId ? locations.find((l) => l.id === v.locationId)?.name : null;
  const assignee = v.assigneeId
    ? assignees.find((u) => u.id === v.assigneeId)
    : null;
  const assigneeLabel = assignee?.name ?? assignee?.email ?? null;

  const status = (v.status as keyof typeof ASSET_STATUS_META) ?? "AVAILABLE";
  const spec = formatSpec(v.memoryGB ?? null, v.storageGB ?? null);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-text text-[16px] font-medium tracking-tight">Review</h2>
          <p className="text-text-muted text-[12.5px]">
            Looks right? Click <span className="font-medium">Save</span> to create the asset.
          </p>
        </div>
        <span className="text-success-fg inline-flex h-7 w-7 items-center justify-center rounded-full bg-success-bg">
          <CheckCircle2 className="h-4 w-4" />
        </span>
      </header>

      <section className="bg-surface space-y-4 rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-text-subtle text-[10.5px] font-semibold uppercase tracking-[0.08em]">
              {v.tag ? v.tag : "Tag will be auto-assigned"}
            </p>
            <h3 className="text-text mt-0.5 text-[18px] font-medium tracking-tight">
              {v.name || "—"}
            </h3>
            <p className="text-text-muted mt-1 text-[12.5px]">
              {[v.brand, v.model, spec].filter(Boolean).join(" · ") || "No additional info"}
            </p>
          </div>
          <AssetStatusBadge status={status} size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KV label="Category" value={category ?? "—"} />
          <KV label="Site" value={site ?? "—"} sub={location ?? null} />
          <KV label="Assignee" value={assigneeLabel ?? "—"} />
          <KV label="Serial" value={v.serialNumber || "—"} mono />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-t pt-3">
          <KV label="CPU" value={v.cpu || "—"} />
          <KV label="Memory" value={v.memoryGB ? `${v.memoryGB} GB` : "—"} />
          <KV label="Storage" value={v.storageGB ? `${v.storageGB} GB` : "—"} />
          <KV label="OS" value={v.os || "—"} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 border-t pt-3">
          <KV label="Purchased" value={formatDate(v.purchaseDate) ?? "—"} />
          <KV label="Price" value={formatMoney(v.purchasePrice, v.currency)} />
          <KV label="Warranty ends" value={formatDate(v.warrantyEndsAt) ?? "—"} />
        </div>

        {v.description ? (
          <div className="border-t pt-3">
            <p className="text-text-subtle mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]">
              Description
            </p>
            <p className="text-text whitespace-pre-wrap text-[12.5px] leading-relaxed">
              {v.description}
            </p>
          </div>
        ) : null}
        {v.notes ? (
          <div className="border-t pt-3">
            <p className="text-text-subtle mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]">
              Notes
            </p>
            <p className="text-text whitespace-pre-wrap text-[12.5px] leading-relaxed">
              {v.notes}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function KV({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-text-subtle text-[10.5px] font-semibold uppercase tracking-[0.06em]">
        {label}
      </p>
      <p className={cn("text-text mt-0.5 text-[12.5px]", mono && "font-mono text-[12px]")}>
        {value}
      </p>
      {sub ? <p className="text-text-subtle text-[11px]">{sub}</p> : null}
    </div>
  );
}

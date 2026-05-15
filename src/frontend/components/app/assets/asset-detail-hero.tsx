"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Box,
  Calendar,
  CalendarClock,
  Cpu,
  Hash,
  HardDrive,
  Monitor,
  Package,
  Pencil,
} from "lucide-react";
import type { AssetStatus } from "@prisma/client";
import { AssetStatusBadge } from "@/frontend/components/app/status-badge";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { Button } from "@/frontend/components/ui/button";
import { formatDate, formatMoney, formatSpec } from "@/shared/format";

export interface HeroProps {
  asset: {
    id: string;
    tag: string;
    name: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    status: AssetStatus;
    cpu: string | null;
    memoryGB: number | null;
    storageGB: number | null;
    displayInches: string | null;
    os: string | null;
    purchaseDate: Date | null;
    purchasePrice: string | null;
    currency: string;
    warrantyEndsAt: Date | null;
    category: { id: string; name: string } | null;
    site: { id: string; name: string } | null;
    location: { id: string; name: string } | null;
    assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  };
}

export function AssetDetailHero({ asset }: HeroProps) {
  const spec = formatSpec(asset.memoryGB, asset.storageGB);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.25, 1, 0.5, 1] }}
      className="bg-surface relative overflow-hidden rounded-xl border p-5"
    >
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-brand-orange-500/5 blur-3xl" aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="asset-tag bg-info-bg/40 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px]">
              <Hash className="h-3 w-3" />
              {asset.tag}
            </span>
            <AssetStatusBadge status={asset.status} />
          </div>
          <h1 className="text-text text-[24px] font-medium leading-tight tracking-tight">
            {asset.name}
          </h1>
          <p className="text-text-muted text-[12.5px]">
            {[asset.brand, asset.model, spec].filter(Boolean).join(" · ") || "No specs yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/assets/${asset.id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
          <Button variant="primary" size="sm" disabled>
            Check out
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat icon={Package} label="Category" value={asset.category?.name ?? "—"} />
        <Stat icon={Box} label="Site" value={asset.site?.name ?? "—"} sub={asset.location?.name ?? null} />
        <Stat
          icon={Cpu}
          label="CPU / RAM"
          value={asset.cpu ?? "—"}
          sub={asset.memoryGB ? `${asset.memoryGB} GB` : null}
        />
        <Stat icon={HardDrive} label="Storage" value={asset.storageGB ? `${asset.storageGB} GB` : "—"} sub={asset.os ?? null} />
        <Stat icon={Calendar} label="Purchased" value={formatDate(asset.purchaseDate)} sub={formatMoney(asset.purchasePrice, asset.currency)} />
        <Stat icon={CalendarClock} label="Warranty" value={formatDate(asset.warrantyEndsAt)} />
      </div>

      {asset.assignee ? (
        <div className="bg-surface-muted/60 mt-5 flex items-center gap-3 rounded-lg border p-3">
          <UserAvatar name={asset.assignee.name ?? asset.assignee.email} src={asset.assignee.image} size={34} />
          <div>
            <p className="text-text text-[12.5px] font-medium">
              Assigned to {asset.assignee.name ?? asset.assignee.email}
            </p>
            <p className="text-text-muted text-[11.5px]">{asset.assignee.email}</p>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Monitor;
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="space-y-1">
      <div className="text-text-subtle flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.06em]">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-text text-[13px] font-medium">{value}</p>
      {sub ? <p className="text-text-muted text-[11.5px]">{sub}</p> : null}
    </div>
  );
}

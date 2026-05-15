"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  Pencil,
  ReceiptText,
  Wrench,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatDate, formatDateTime, timeAgo } from "@/shared/format";
import {
  MAINTENANCE_STATUS_META,
  MAINTENANCE_TYPE_META,
} from "@/shared/constants";
import type { LeaseStatus, MaintenanceStatus, MaintenanceType } from "@prisma/client";

type EventKind = "checkout" | "checkin" | "maintenance" | "lease" | "audit";

export interface TimelineEvent {
  id: string;
  kind: EventKind;
  at: Date;
  title: string;
  meta?: string | null;
  badge?: { label: string; tone: "info" | "warning" | "success" | "muted" | "danger" } | null;
  actor?: { name?: string | null; email?: string | null } | null;
}

interface CheckoutInput {
  id: string;
  checkedOutAt: Date;
  returnedAt: Date | null;
  dueAt: Date | null;
  notes: string | null;
  toUser: { name: string | null; email: string } | null;
  toPerson: { firstName: string; lastName: string } | null;
  toSite: { name: string } | null;
  toCustomer: { name: string } | null;
}

interface MaintenanceInput {
  id: string;
  createdAt: Date;
  scheduledAt: Date | null;
  completedAt: Date | null;
  status: MaintenanceStatus;
  type: MaintenanceType;
  vendor: string | null;
  description: string | null;
}

interface LeaseInput {
  id: string;
  vendor: string;
  startDate: Date;
  endDate: Date;
  status: LeaseStatus;
}

interface AuditInput {
  id: string;
  createdAt: Date;
  action: string;
  actor: { name: string | null; email: string };
}

interface Props {
  checkouts: CheckoutInput[];
  maintenance: MaintenanceInput[];
  lease: LeaseInput | null;
  auditLogs: AuditInput[];
}

const KIND_LABEL: Record<EventKind, string> = {
  checkout: "Checkout",
  checkin: "Check-in",
  maintenance: "Maintenance",
  lease: "Lease",
  audit: "Edits",
};

const KIND_ICON: Record<EventKind, typeof ArrowUpFromLine> = {
  checkout: ArrowUpFromLine,
  checkin: ArrowDownToLine,
  maintenance: Wrench,
  lease: ReceiptText,
  audit: Pencil,
};

const KIND_RING: Record<EventKind, string> = {
  checkout: "ring-success-fg/40 bg-success-bg text-success-fg",
  checkin: "ring-info-fg/40 bg-info-bg text-info-fg",
  maintenance: "ring-warning-fg/40 bg-warning-bg text-warning-fg",
  lease: "ring-brand-orange-500/40 bg-brand-orange-500/10 text-brand-orange-500",
  audit: "ring-text-subtle/30 bg-surface-muted text-text-muted",
};

export function AssetTimeline({ checkouts, maintenance, lease, auditLogs }: Props) {
  const [filter, setFilter] = useState<"all" | EventKind>("all");

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];

    for (const co of checkouts) {
      const target =
        co.toUser?.name ??
        co.toUser?.email ??
        (co.toPerson ? `${co.toPerson.firstName} ${co.toPerson.lastName}` : null) ??
        co.toSite?.name ??
        co.toCustomer?.name ??
        "—";
      list.push({
        id: `co-out-${co.id}`,
        kind: "checkout",
        at: co.checkedOutAt,
        title: `Checked out to ${target}`,
        meta: co.dueAt ? `Due ${formatDate(co.dueAt)}` : null,
        badge: co.returnedAt
          ? { label: "Returned", tone: "muted" }
          : { label: "Active", tone: "success" },
      });
      if (co.returnedAt) {
        list.push({
          id: `co-in-${co.id}`,
          kind: "checkin",
          at: co.returnedAt,
          title: `Returned from ${target}`,
          meta: co.notes ?? null,
          badge: { label: "Returned", tone: "info" },
        });
      }
    }

    for (const m of maintenance) {
      const typeMeta = MAINTENANCE_TYPE_META[m.type];
      const statusMeta = MAINTENANCE_STATUS_META[m.status];
      list.push({
        id: `m-${m.id}`,
        kind: "maintenance",
        at: m.completedAt ?? m.scheduledAt ?? m.createdAt,
        title: `${typeMeta.label}${m.vendor ? ` · ${m.vendor}` : ""}`,
        meta: m.description ?? null,
        badge: { label: statusMeta.label, tone: statusMeta.tone },
      });
    }

    if (lease) {
      list.push({
        id: `l-start-${lease.id}`,
        kind: "lease",
        at: lease.startDate,
        title: `Lease started · ${lease.vendor}`,
        meta: `Term ends ${formatDate(lease.endDate)}`,
      });
    }

    for (const log of auditLogs.slice(0, 15)) {
      list.push({
        id: `a-${log.id}`,
        kind: "audit",
        at: log.createdAt,
        title: log.action,
        actor: { name: log.actor.name, email: log.actor.email },
      });
    }

    return list.sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [checkouts, maintenance, lease, auditLogs]);

  const filtered = filter === "all" ? events : events.filter((e) => e.kind === filter);

  const filterChips: Array<{ value: "all" | EventKind; count: number }> = [
    { value: "all", count: events.length },
    ...(["checkout", "checkin", "maintenance", "lease", "audit"] as EventKind[])
      .map((k) => ({ value: k, count: events.filter((e) => e.kind === k).length }))
      .filter((c) => c.count > 0),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="text-text-subtle h-3 w-3" />
        {filterChips.map((chip) => {
          const isActive = filter === chip.value;
          const label = chip.value === "all" ? "All" : KIND_LABEL[chip.value];
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter(chip.value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                isActive
                  ? "border-brand-orange-500/50 bg-brand-orange-500/10 text-text"
                  : "border-border-subtle text-text-muted hover:border-border hover:text-text",
              )}
            >
              {label}
              <span className="text-text-subtle tabular-nums">{chip.count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-subtle bg-surface rounded-xl border px-4 py-10 text-center text-[12.5px]">
          No events match.
        </p>
      ) : (
        <ol className="bg-surface relative rounded-xl border p-4">
          <span className="bg-border-subtle absolute bottom-4 left-[26px] top-4 w-px" aria-hidden />
          <div className="space-y-3">
            {filtered.map((evt, idx) => {
              const Icon = KIND_ICON[evt.kind];
              return (
                <motion.li
                  key={evt.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx, 8) * 0.025 }}
                  className="relative flex items-start gap-3"
                >
                  <span
                    className={cn(
                      "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-[color:var(--color-surface)]",
                      KIND_RING[evt.kind],
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-text text-[12.5px] font-medium">{evt.title}</span>
                      {evt.badge ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-px text-[10px] font-medium",
                            toneToClass(evt.badge.tone),
                          )}
                        >
                          {evt.badge.label}
                        </span>
                      ) : null}
                    </div>
                    {evt.meta ? (
                      <p className="text-text-muted mt-0.5 text-[11.5px]">{evt.meta}</p>
                    ) : null}
                    <p className="text-text-subtle mt-0.5 text-[10.5px]">
                      {formatDateTime(evt.at)} · {timeAgo(evt.at)}
                      {evt.actor?.name ? ` · ${evt.actor.name}` : ""}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </div>
        </ol>
      )}
    </div>
  );
}

function toneToClass(tone: "info" | "warning" | "success" | "muted" | "danger") {
  switch (tone) {
    case "success":
      return "bg-success-bg text-success-fg";
    case "info":
      return "bg-info-bg text-info-fg";
    case "warning":
      return "bg-warning-bg text-warning-fg";
    case "danger":
      return "bg-danger-bg text-danger-fg";
    default:
      return "bg-surface-muted text-text-muted";
  }
}

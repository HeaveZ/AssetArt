"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  KeyRound,
  SearchX,
  Shield,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AlertSeverity, AlertType } from "@prisma/client";
import { Badge } from "@/frontend/components/ui/badge";
import { timeAgo } from "@/shared/format";
import { cn } from "@/frontend/lib/utils";

export type AlertItem = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: Date;
};

const TYPE_ICON: Record<AlertType, LucideIcon> = {
  WARRANTY_EXPIRING: Shield,
  LEASE_EXPIRING:    CalendarClock,
  MAINTENANCE_DUE:   Wrench,
  LICENSE_EXPIRING:  KeyRound,
  ASSET_OVERDUE:     AlertCircle,
  ASSET_MISSING:     SearchX,
};

const SEVERITY_META: Record<AlertSeverity, { tone: "info" | "warning" | "danger"; ring: string; bg: string }> = {
  INFO:     { tone: "info",    ring: "ring-info-ring/40",    bg: "bg-info-bg/50" },
  WARNING:  { tone: "warning", ring: "ring-warning-ring/40", bg: "bg-warning-bg/40" },
  CRITICAL: { tone: "danger",  ring: "ring-danger-ring/40",  bg: "bg-danger-bg/40" },
};

export function AlertsWidget({ alerts }: { alerts: AlertItem[] }) {
  return (
    <section className="bg-surface rounded-xl border">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="space-y-0.5">
          <h2 className="text-text text-[13.5px] font-medium tracking-tight">Alerts</h2>
          <p className="text-text-muted text-[11.5px]">Top 5 by severity</p>
        </div>
        <Link
          href="/alerts"
          className="text-text-muted hover:text-text inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
        >
          Inbox
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>
      {alerts.length === 0 ? (
        <div className="text-text-muted p-8 text-center text-[12.5px]">All clear.</div>
      ) : (
        <ol className="p-2">
          {alerts.map((a, i) => {
            const Icon = TYPE_ICON[a.type] ?? AlertCircle;
            const meta = SEVERITY_META[a.severity];
            return (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.04 * i }}
              >
                <Link
                  href={a.resourceType === "asset" && a.resourceId ? `/assets/${a.resourceId}` : "/alerts"}
                  className={cn(
                    "group/alert flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors",
                    "hover:bg-surface-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
                      meta.bg,
                      meta.ring,
                    )}
                  >
                    <Icon
                      className={cn("h-3.5 w-3.5", {
                        "text-info-fg": meta.tone === "info",
                        "text-warning-fg": meta.tone === "warning",
                        "text-danger-fg": meta.tone === "danger",
                      })}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-text text-[12.5px] font-medium leading-snug">{a.title}</p>
                    <p className="text-text-muted line-clamp-1 mt-0.5 text-[11.5px]">
                      {a.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge tone={meta.tone} size="sm">
                      {a.severity.toLowerCase()}
                    </Badge>
                    <span className="text-text-subtle text-[10.5px]">{timeAgo(a.createdAt)}</span>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertTriangle,
  BellOff,
  CalendarClock,
  Check,
  CheckCheck,
  KeyRound,
  Loader2,
  RefreshCw,
  SearchX,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { FilterTabs } from "@/frontend/components/common/filter-tabs";
import { cn } from "@/frontend/lib/utils";
import {
  dismissAlertsAction,
  markAlertReadAction,
  markAllAlertsReadAction,
  regenerateAlertsAction,
} from "@/backend/actions/alerts";
import { ALERT_SEVERITY_META, ALERT_TYPE_META } from "@/shared/constants";
import { timeAgo } from "@/shared/format";
import type { AlertRow } from "@/backend/services/alerts";
import type { AlertSeverity, AlertType } from "@prisma/client";

interface Props {
  rows: AlertRow[];
  total: number;
  unreadCount: number;
}

const TYPE_ICON: Record<AlertType, typeof AlertTriangle> = {
  WARRANTY_EXPIRING: ShieldAlert,
  LEASE_EXPIRING: CalendarClock,
  MAINTENANCE_DUE: Wrench,
  LICENSE_EXPIRING: KeyRound,
  ASSET_OVERDUE: AlertTriangle,
  ASSET_MISSING: SearchX,
};

type ReadState = "ALL" | "UNREAD" | "READ";
type SeverityFilter = "ALL" | AlertSeverity;

const READ_TAB_LABEL: Record<ReadState, string> = { ALL: "All", UNREAD: "Unread", READ: "Read" };
const READ_TAB_ORDER: ReadState[] = ["ALL", "UNREAD", "READ"];
const SEVERITY_TAB_ORDER: SeverityFilter[] = ["ALL", "CRITICAL", "WARNING", "INFO"];

export function AlertsInbox({ rows, total, unreadCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const readState = (searchParams.get("read") ?? "ALL") as ReadState;
  const activeSeverity = (searchParams.get("severity") ?? "ALL") as SeverityFilter;

  const readTabs = READ_TAB_ORDER.map((value) => ({
    value,
    label: READ_TAB_LABEL[value],
    count: value === "UNREAD" ? unreadCount : value === "ALL" ? total : undefined,
  }));
  const severityTabs = SEVERITY_TAB_ORDER.map((value) => ({
    value,
    label: value === "ALL" ? "Any severity" : ALERT_SEVERITY_META[value].label,
  }));

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.replace(`/alerts${params.toString() ? `?${params}` : ""}`);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  function runDismiss(ids: string[]) {
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await dismissAlertsAction(ids);
      if (!result.ok) {
        toast.error("Dismiss failed", { description: result.error });
        return;
      }
      toast.success(`${result.data.dismissed} dismissed`);
      setSelected(new Set());
      router.refresh();
    });
  }

  function runMarkRead(id: string, read: boolean) {
    startTransition(async () => {
      await markAlertReadAction(id, read);
      router.refresh();
    });
  }

  function runMarkAllRead() {
    startTransition(async () => {
      const result = await markAllAlertsReadAction();
      if (!result.ok) toast.error(result.error);
      else toast.success(`Marked ${result.data.updated} as read`);
      router.refresh();
    });
  }

  function runRegenerate() {
    startTransition(async () => {
      const result = await regenerateAlertsAction();
      if (!result.ok) toast.error(result.error);
      else toast.success(`${result.data.created} new alert${result.data.created === 1 ? "" : "s"}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FilterTabs
            tabs={readTabs}
            active={readState}
            onChange={(v) => setParam("read", v === "ALL" ? null : v)}
          />
          <FilterTabs
            tabs={severityTabs}
            active={activeSeverity}
            onChange={(v) => setParam("severity", v === "ALL" ? null : v)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {selected.size > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => runDismiss(Array.from(selected))} disabled={pending}>
              <BellOff />
              Dismiss ({selected.size})
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={runMarkAllRead} disabled={pending || unreadCount === 0}>
            <CheckCheck />
            Mark all read
          </Button>
          <Button size="sm" variant="ghost" onClick={runRegenerate} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Regenerate
          </Button>
        </div>
      </div>

      <div className="bg-surface overflow-hidden rounded-xl border">
        {rows.length === 0 ? (
          <div className="text-text-muted flex flex-col items-center px-6 py-16 text-[12.5px]">
            <AlertTriangle className="text-text-subtle/60 mb-2 h-5 w-5" />
            All clear — no alerts match these filters.
          </div>
        ) : (
          <>
            <div className="bg-surface-muted/40 border-b px-3 py-2 text-[11px]">
              <button
                type="button"
                onClick={selectAll}
                className="text-text-muted hover:text-text"
              >
                {selected.size === rows.length ? "Clear selection" : `Select all (${rows.length})`}
              </button>
            </div>
            <ul className="divide-y divide-border-subtle">
              {rows.map((alert, i) => {
                const TypeIcon = TYPE_ICON[alert.type];
                const sev = ALERT_SEVERITY_META[alert.severity];
                const isUnread = !alert.readAt;
                const checked = selected.has(alert.id);
                const link = alert.resourceType === "asset" && alert.resourceId
                  ? `/assets/${alert.resourceId}`
                  : alert.resourceType === "lease"
                    ? `/leases`
                    : alert.resourceType === "maintenance"
                      ? `/maintenance`
                      : alert.resourceType === "license"
                        ? `/licenses`
                        : null;

                return (
                  <motion.li
                    key={alert.id}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, delay: Math.min(i, 12) * 0.012 }}
                    className={cn("transition-colors", isUnread ? "bg-brand-orange-500/[0.03]" : "")}
                  >
                    <div className="flex items-start gap-3 px-3 py-3">
                      <Checkbox checked={checked} onCheckedChange={() => toggle(alert.id)} className="mt-1" />
                      <div className={cn("mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md", sev.bg, sev.fg)}>
                        <TypeIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className={cn("text-text text-[13px] truncate", isUnread && "font-semibold")}>{alert.title}</p>
                          <span className={cn("rounded-full px-1.5 py-px text-[10px] font-medium", sev.bg, sev.fg)}>
                            {sev.label}
                          </span>
                          <span className="text-text-subtle text-[10.5px]">
                            · {ALERT_TYPE_META[alert.type].label}
                          </span>
                        </div>
                        <p className="text-text-muted mt-0.5 text-[12px] leading-relaxed">{alert.message}</p>
                        <div className="text-text-subtle mt-1 flex items-center gap-3 text-[11px]">
                          <span>{timeAgo(alert.createdAt)}</span>
                          {link ? (
                            <Link href={link} className="hover:text-text">
                              Open →
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => runMarkRead(alert.id, isUnread)}
                          title={isUnread ? "Mark read" : "Mark unread"}
                        >
                          <Check className={cn("h-3.5 w-3.5", !isUnread && "opacity-40")} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => runDismiss([alert.id])}
                          title="Dismiss"
                        >
                          <BellOff className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, CircleX, Loader2, PlayCircle, RefreshCw, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import {
  cancelMaintenanceAction,
  completeMaintenanceAction,
  recomputeOverdueMaintenanceAction,
  startMaintenanceAction,
} from "@/backend/actions/maintenance";
import { MAINTENANCE_STATUS_META, MAINTENANCE_TYPE_META } from "@/shared/constants";
import { formatDate, formatMoney } from "@/shared/format";
import { cn } from "@/frontend/lib/utils";
import type { MaintenanceRow } from "@/backend/services/maintenance";
import type { MaintenanceStatus } from "@prisma/client";

interface Props {
  rows: MaintenanceRow[];
  counts: Record<MaintenanceStatus, number>;
  total: number;
}

const STATUS_TABS: { value: "ALL" | MaintenanceStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function MaintenanceList({ rows, counts, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeStatus = searchParams.get("status") ?? "ALL";

  function setStatus(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "ALL") params.delete("status");
    else params.set("status", next);
    params.delete("page");
    router.replace(`/maintenance${params.toString() ? `?${params}` : ""}`);
  }

  function runRecompute() {
    startTransition(async () => {
      const result = await recomputeOverdueMaintenanceAction();
      if (!result.ok) toast.error(result.error);
      else toast.success(`${result.data.flipped} record(s) flipped to overdue`);
      router.refresh();
    });
  }

  function runAction(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.error(label + " failed", { description: result.error });
      else toast.success(label);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="bg-surface flex flex-wrap items-center gap-1 rounded-lg border p-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === "ALL" ? total : counts[tab.value];
            const active = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                  active ? "bg-brand-orange-500/10 text-brand-orange-700" : "text-text-muted hover:text-text",
                )}
              >
                {tab.label}
                <span className={cn("text-[10.5px]", active ? "text-brand-orange-700/80" : "text-text-subtle")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" onClick={runRecompute} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Recompute overdue
        </Button>
      </div>

      <div className="bg-surface overflow-hidden rounded-xl border">
        {rows.length === 0 ? (
          <div className="text-text-muted flex flex-col items-center px-6 py-16 text-[12.5px]">
            <Wrench className="text-text-subtle/60 mb-2 h-5 w-5" />
            No maintenance records match.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-muted text-text-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Asset</th>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Type</th>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Status</th>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Scheduled</th>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Vendor</th>
                  <th className="px-3 py-2 text-right text-[10.5px] font-medium uppercase tracking-[0.06em]">Cost</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const meta = MAINTENANCE_STATUS_META[r.status];
                  const isFinal = r.status === "COMPLETED" || r.status === "CANCELLED";
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, delay: Math.min(i, 12) * 0.015 }}
                      className="border-t border-border-subtle hover:bg-surface-muted/60 transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/assets/${r.asset.id}`}
                          className="flex items-center gap-2 text-text hover:text-info-fg"
                        >
                          <span className="asset-tag text-[11px]">{r.asset.tag}</span>
                          <span className="truncate font-medium">{r.asset.name}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-text-muted">{MAINTENANCE_TYPE_META[r.type].label}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={meta.tone} size="sm">
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-text-muted">{formatDate(r.scheduledAt)}</td>
                      <td className="px-3 py-2.5 text-text-muted truncate">{r.vendor ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right num tabular-nums text-text">
                        {r.cost ? formatMoney(r.cost, r.currency) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {!isFinal ? (
                          <div className="inline-flex items-center gap-1">
                            {r.status === "SCHEDULED" || r.status === "OVERDUE" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={pending}
                                onClick={() =>
                                  runAction("Started", () => startMaintenanceAction(r.id))
                                }
                              >
                                <PlayCircle />
                                Start
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() =>
                                runAction("Completed", () => completeMaintenanceAction({ id: r.id }))
                              }
                            >
                              <Check />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => runAction("Cancelled", () => cancelMaintenanceAction(r.id))}
                            >
                              <CircleX />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-text-subtle text-[11px]">
                            {r.completedAt ? formatDate(r.completedAt) : "—"}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

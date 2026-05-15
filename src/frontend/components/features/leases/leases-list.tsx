"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { CircleX, Loader2, ReceiptText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { FilterTabs } from "@/frontend/components/common/filter-tabs";
import { LEASE_STATUS_META } from "@/shared/constants";
import { formatDate, formatMoney } from "@/shared/format";
import { cn } from "@/frontend/lib/utils";
import { cancelLeaseAction, regenerateLeaseAlertsAction } from "@/backend/actions/leases";
import type { LeaseRow } from "@/backend/services/leases";
import type { LeaseSegment } from "@/shared/schemas/lease";

type SegmentTab = "ALL" | LeaseSegment;

interface Props {
  rows: LeaseRow[];
  counts: Record<LeaseSegment, number>;
}

const SEGMENT_LABELS: Record<SegmentTab, string> = {
  ALL: "All",
  ACTIVE: "Active",
  EXPIRING: "Expiring soon",
  ENDED: "Ended",
};
const SEGMENT_ORDER: SegmentTab[] = ["ALL", "ACTIVE", "EXPIRING", "ENDED"];

export function LeasesList({ rows, counts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const active = (searchParams.get("segment") ?? "ALL") as SegmentTab;

  function setSegment(next: SegmentTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "ALL") params.delete("segment");
    else params.set("segment", next);
    router.replace(`/leases${params.toString() ? `?${params}` : ""}`);
  }

  function recompute() {
    startTransition(async () => {
      const result = await regenerateLeaseAlertsAction();
      if (!result.ok) toast.error(result.error);
      else toast.success(`${result.data.created} new alert${result.data.created === 1 ? "" : "s"}`);
      router.refresh();
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      const result = await cancelLeaseAction(id);
      if (!result.ok) toast.error("Cancel failed", { description: result.error });
      else toast.success("Lease cancelled");
      router.refresh();
    });
  }

  const allCount = counts.ACTIVE + counts.EXPIRING + counts.ENDED;
  const filterTabs = SEGMENT_ORDER.map((value) => ({
    value,
    label: SEGMENT_LABELS[value],
    count: value === "ALL" ? allCount : counts[value],
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterTabs tabs={filterTabs} active={active} onChange={setSegment} />
        <Button variant="ghost" size="sm" onClick={recompute} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Regenerate expiring alerts
        </Button>
      </div>

      <div className="bg-surface overflow-hidden rounded-xl border">
        {rows.length === 0 ? (
          <div className="text-text-muted flex flex-col items-center px-6 py-16 text-[12.5px]">
            <ReceiptText className="text-text-subtle/60 mb-2 h-5 w-5" />
            No leases in this segment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-muted text-text-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Asset</th>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Vendor</th>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Window</th>
                  <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">Status</th>
                  <th className="px-3 py-2 text-right text-[10.5px] font-medium uppercase tracking-[0.06em]">Monthly</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const meta = LEASE_STATUS_META[r.status];
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
                      <td className="px-3 py-2.5">
                        <div className="text-text">{r.vendor}</div>
                        {r.contractRef ? (
                          <div className="text-text-subtle text-[11px]">Ref: {r.contractRef}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-text-muted">
                        <div>{formatDate(r.startDate)} → {formatDate(r.endDate)}</div>
                        {r.status !== "ENDED" && r.status !== "CANCELLED" ? (
                          <div
                            className={cn(
                              "text-[11px]",
                              r.daysToEnd <= 30
                                ? "text-warning-fg"
                                : r.daysToEnd <= 0
                                  ? "text-danger-fg"
                                  : "text-text-subtle",
                            )}
                          >
                            {r.daysToEnd < 0
                              ? `${Math.abs(r.daysToEnd)}d overdue`
                              : `${r.daysToEnd}d to go`}
                            {r.autoRenew ? " · auto-renew" : ""}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={meta.tone} size="sm">
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right num tabular-nums text-text">
                        {formatMoney(r.monthlyCost, r.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {r.status === "ACTIVE" || r.status === "EXPIRING" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => cancel(r.id)}
                          >
                            <CircleX />
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-text-subtle text-[11px]">—</span>
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

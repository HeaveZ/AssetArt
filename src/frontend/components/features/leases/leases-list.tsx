"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleX, Loader2, ReceiptText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { FilterTabs } from "@/frontend/components/common/filter-tabs";
import {
  AssetLinkCell,
  DataRow,
  DataTableShell,
  type DataTableColumn,
} from "@/frontend/components/common/data-table";
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

const COLUMNS: DataTableColumn[] = [
  { label: "Asset" },
  { label: "Vendor" },
  { label: "Window" },
  { label: "Status" },
  { label: "Monthly", align: "right" },
  { label: "" },
];

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

      <DataTableShell
        columns={COLUMNS}
        rowCount={rows.length}
        empty={{ icon: <ReceiptText />, label: "No leases in this segment." }}
      >
        {rows.map((r, i) => {
          const meta = LEASE_STATUS_META[r.status];
          return (
            <DataRow key={r.id} index={i}>
              <AssetLinkCell asset={r.asset} />
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
            </DataRow>
          );
        })}
      </DataTableShell>
    </div>
  );
}

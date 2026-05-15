"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CircleX, Loader2, PlayCircle, RefreshCw, Wrench } from "lucide-react";
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
import {
  cancelMaintenanceAction,
  completeMaintenanceAction,
  recomputeOverdueMaintenanceAction,
  startMaintenanceAction,
} from "@/backend/actions/maintenance";
import { MAINTENANCE_STATUS_META, MAINTENANCE_TYPE_META } from "@/shared/constants";
import { formatDate, formatMoney } from "@/shared/format";
import type { MaintenanceRow } from "@/backend/services/maintenance";
import type { MaintenanceStatus } from "@prisma/client";

type StatusTab = "ALL" | MaintenanceStatus;

interface Props {
  rows: MaintenanceRow[];
  counts: Record<MaintenanceStatus, number>;
  total: number;
}

const STATUS_LABELS: Record<StatusTab, string> = {
  ALL: "All",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  OVERDUE: "Overdue",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
const STATUS_ORDER: StatusTab[] = ["ALL", "SCHEDULED", "IN_PROGRESS", "OVERDUE", "COMPLETED", "CANCELLED"];

const COLUMNS: DataTableColumn[] = [
  { label: "Asset" },
  { label: "Type" },
  { label: "Status" },
  { label: "Scheduled" },
  { label: "Vendor" },
  { label: "Cost", align: "right" },
  { label: "" },
];

export function MaintenanceList({ rows, counts, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeStatus = (searchParams.get("status") ?? "ALL") as StatusTab;

  const filterTabs = STATUS_ORDER.map((value) => ({
    value,
    label: STATUS_LABELS[value],
    count: value === "ALL" ? total : counts[value],
  }));

  function setStatus(next: StatusTab) {
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
        <FilterTabs tabs={filterTabs} active={activeStatus} onChange={setStatus} />
        <Button variant="ghost" size="sm" onClick={runRecompute} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Recompute overdue
        </Button>
      </div>

      <DataTableShell
        columns={COLUMNS}
        rowCount={rows.length}
        empty={{ icon: <Wrench />, label: "No maintenance records match." }}
      >
        {rows.map((r, i) => {
          const meta = MAINTENANCE_STATUS_META[r.status];
          const isFinal = r.status === "COMPLETED" || r.status === "CANCELLED";
          return (
            <DataRow key={r.id} index={i}>
              <AssetLinkCell asset={r.asset} />
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
            </DataRow>
          );
        })}
      </DataTableShell>
    </div>
  );
}

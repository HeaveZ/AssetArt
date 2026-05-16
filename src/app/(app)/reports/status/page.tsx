import type { Metadata } from "next";
import { requireSession } from "@/backend/session";
import { getStatusReport } from "@/backend/services/reports";
import { ReportShell } from "@/frontend/components/features/reports/report-shell";
import { PrintButton } from "@/frontend/components/features/reports/print-button";
import { AssetStatusBadge } from "@/frontend/components/common/status-badge";
import { ASSET_STATUS_META } from "@/shared/constants";
import { formatMoney } from "@/shared/format";
import type { AssetStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Status mix · Reports" };

const STATUS_ORDER: AssetStatus[] = [
  "AVAILABLE",
  "CHECKED_OUT",
  "IN_MAINTENANCE",
  "RESERVED",
  "LEASED",
  "DISPOSED",
  "LOST",
];

export default async function StatusReportPage() {
  const session = await requireSession();
  const rows = await getStatusReport(session.workspaceId);

  // Ensure every status appears even if count = 0, in canonical order.
  const map = new Map(rows.map((r) => [r.status, r]));
  const ordered = STATUS_ORDER.map(
    (status) => map.get(status) ?? { status, count: 0, value: null },
  );

  const totalCount = ordered.reduce((n, r) => n + r.count, 0);
  const totalValue = ordered.reduce(
    (n, r) => n + (r.value ? Number(r.value) : 0),
    0,
  );

  return (
    <ReportShell
      title="Status mix"
      category="Status reports"
      description="Counts and total purchase value grouped by asset status. Live, recomputed on every load."
      rowCount={totalCount}
      actions={<PrintButton />}
    >
      <div className="bg-surface overflow-hidden rounded-xl border">
        <div className="border-b bg-surface-muted/30 px-4 py-3 text-[12px]">
          <span className="text-text-muted">
            Total{" "}
            <span className="text-text num font-medium tabular-nums">{totalCount}</span> assets ·
            portfolio value{" "}
            <span className="text-text num font-medium tabular-nums">
              {formatMoney(totalValue.toFixed(2))}
            </span>
          </span>
        </div>
        <ul className="divide-y">
          {ordered.map((r) => {
            const meta = ASSET_STATUS_META[r.status];
            const pct = totalCount > 0 ? (r.count / totalCount) * 100 : 0;
            return (
              <li key={r.status} className="px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[12.5px]">
                  <div className="flex items-center gap-2">
                    <AssetStatusBadge status={r.status} />
                    <span className="text-text-subtle text-[11px]">{meta.label}</span>
                  </div>
                  <div className="num text-text font-medium tabular-nums">
                    {r.count.toLocaleString()}
                    <span className="text-text-subtle ml-1.5 text-[11px] font-normal">
                      ({pct.toFixed(0)}%)
                    </span>
                    {r.value ? (
                      <span className="text-text-muted ml-3 text-[11.5px] font-normal">
                        {formatMoney(r.value)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="bg-surface-muted relative h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ${meta.dot}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ReportShell>
  );
}

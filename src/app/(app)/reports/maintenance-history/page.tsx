import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/backend/session";
import { getMaintenanceHistory } from "@/backend/services/reports";
import { ReportShell } from "@/frontend/components/features/reports/report-shell";
import { PrintButton } from "@/frontend/components/features/reports/print-button";
import { Badge } from "@/frontend/components/ui/badge";
import { formatDate, formatMoney } from "@/shared/format";

export const metadata: Metadata = { title: "Maintenance history · Reports" };

const STATUS_TONE: Record<string, "info" | "success" | "warning" | "muted" | "danger"> = {
  SCHEDULED: "info",
  IN_PROGRESS: "warning",
  DONE: "success",
  COMPLETED: "success",
  CANCELLED: "muted",
  OVERDUE: "danger",
};

export default async function MaintenanceHistoryReportPage() {
  const session = await requireSession();
  const rows = await getMaintenanceHistory(session.workspaceId);

  const totalSpend = rows.reduce(
    (n, r) => n + (r.cost ? Number(r.cost) : 0),
    0,
  );

  return (
    <ReportShell
      title="Maintenance history"
      category="Maintenance reports"
      description="The 200 most recent maintenance events across your portfolio."
      rowCount={rows.length}
      actions={<PrintButton />}
    >
      <div className="bg-surface overflow-hidden rounded-xl border">
        <div className="border-b bg-surface-muted/30 px-4 py-3 text-[12px]">
          <span className="text-text-muted">
            Total spend on this slice:{" "}
            <span className="text-text num font-medium tabular-nums">
              {formatMoney(totalSpend.toFixed(2))}
            </span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <Th>Asset</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Scheduled</Th>
                <Th>Completed</Th>
                <Th>Vendor</Th>
                <Th align="right">Cost</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border-subtle hover:bg-surface-muted/40"
                >
                  <Td>
                    <Link href={`/assets/${r.asset.id}`} className="asset-tag font-medium">
                      {r.asset.tag}
                    </Link>
                    <span className="text-text-subtle ml-2 text-[11px]">{r.asset.name}</span>
                  </Td>
                  <Td>
                    <span className="text-text">{r.type}</span>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[r.status] ?? "muted"} size="sm">
                      {r.status}
                    </Badge>
                  </Td>
                  <Td>
                    {r.scheduledAt ? (
                      <span className="text-text-muted text-[11.5px]">
                        {formatDate(r.scheduledAt)}
                      </span>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </Td>
                  <Td>
                    {r.completedAt ? (
                      <span className="text-text-muted text-[11.5px]">
                        {formatDate(r.completedAt)}
                      </span>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </Td>
                  <Td>{r.vendor ?? <span className="text-text-subtle">—</span>}</Td>
                  <Td align="right">
                    {r.cost ? (
                      <span className="num tabular-nums font-medium">{formatMoney(r.cost)}</span>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </Td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-text-muted py-12 text-center text-[12.5px]">
                    No maintenance recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </ReportShell>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em] ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td className={`px-3 py-2.5 align-middle ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

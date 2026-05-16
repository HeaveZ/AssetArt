import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/backend/session";
import { getActiveLeases } from "@/backend/services/reports";
import { ReportShell } from "@/frontend/components/features/reports/report-shell";
import { PrintButton } from "@/frontend/components/features/reports/print-button";
import { Badge } from "@/frontend/components/ui/badge";
import { formatDate, formatMoney } from "@/shared/format";

export const metadata: Metadata = { title: "Active leases · Reports" };

function daysUntil(date: Date): number {
  const ms = date.getTime() - Date.now();
  return Math.round(ms / 86400000);
}

export default async function ActiveLeasesReportPage() {
  const session = await requireSession();
  const rows = await getActiveLeases(session.workspaceId);

  const totalMonthly = rows.reduce((n, r) => n + Number(r.monthlyCost), 0);

  return (
    <ReportShell
      title="Active leases"
      category="Leased asset reports"
      description="Open leases with the closest expiry first. Monthly run-rate is totaled below."
      rowCount={rows.length}
      actions={<PrintButton />}
    >
      <div className="bg-surface overflow-hidden rounded-xl border">
        <div className="border-b bg-surface-muted/30 px-4 py-3 text-[12px]">
          <span className="text-text-muted">
            Monthly run-rate:{" "}
            <span className="text-text num font-medium tabular-nums">
              {formatMoney(totalMonthly.toFixed(2), rows[0]?.currency ?? "USD")}
            </span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <Th>Asset</Th>
                <Th>Vendor</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Time left</Th>
                <Th align="right">Monthly</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const days = daysUntil(r.endDate);
                const tone: "danger" | "warning" | "success" =
                  days < 30 ? "danger" : days < 90 ? "warning" : "success";
                const label =
                  days < 0
                    ? `${Math.abs(days)} days overdue`
                    : `${days} day${days === 1 ? "" : "s"} left`;
                return (
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
                      <span className="text-text">{r.vendor}</span>
                    </Td>
                    <Td>
                      <span className="text-text-muted text-[11.5px]">{formatDate(r.startDate)}</span>
                    </Td>
                    <Td>
                      <span className="text-text-muted text-[11.5px]">{formatDate(r.endDate)}</span>
                    </Td>
                    <Td>
                      <Badge tone={tone} size="sm">
                        {label}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <span className="num tabular-nums font-medium">
                        {formatMoney(r.monthlyCost, r.currency)}
                      </span>
                    </Td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-text-muted py-12 text-center text-[12.5px]">
                    No active leases.
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

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpFromLine } from "lucide-react";
import { requireSession } from "@/backend/session";
import { getActiveCheckouts } from "@/backend/services/reports";
import { ReportShell } from "@/frontend/components/features/reports/report-shell";
import { PrintButton } from "@/frontend/components/features/reports/print-button";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { formatDate } from "@/shared/format";

export const metadata: Metadata = { title: "Active check-outs · Reports" };

function targetLabel(row: Awaited<ReturnType<typeof getActiveCheckouts>>[number]): string {
  if (row.toUser) return row.toUser.name ?? row.toUser.email;
  if (row.toPerson) return `${row.toPerson.firstName} ${row.toPerson.lastName ?? ""}`.trim();
  if (row.toSite) return row.toSite.name;
  if (row.toCustomer) return row.toCustomer.name;
  return "—";
}

function targetKind(row: Awaited<ReturnType<typeof getActiveCheckouts>>[number]): string {
  if (row.toUser) return "User";
  if (row.toPerson) return "Person";
  if (row.toSite) return "Site";
  if (row.toCustomer) return "Customer";
  return "Unknown";
}

export default async function ActiveCheckoutsReportPage() {
  const session = await requireSession();
  const rows = await getActiveCheckouts(session.workspaceId);

  const now = new Date();
  const overdueCount = rows.filter(
    (r) => r.dueAt && r.dueAt < now,
  ).length;

  return (
    <ReportShell
      title="Active check-outs"
      category="Check-out reports"
      description="Every asset that's been checked out and not yet returned. Overdue items are flagged."
      rowCount={rows.length}
      actions={
        <>
          <Button asChild variant="secondary" size="sm">
            <Link href="/checkin">
              <ArrowUpFromLine /> Check items in
            </Link>
          </Button>
          <PrintButton />
        </>
      }
    >
      {overdueCount > 0 ? (
        <div className="bg-danger-bg/30 border-danger-fg/30 text-danger-fg rounded-xl border px-4 py-2.5 text-[12.5px]">
          <span className="font-medium">{overdueCount}</span> item
          {overdueCount === 1 ? "" : "s"} past expected return.
        </div>
      ) : null}

      <div className="bg-surface overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <Th>Tag</Th>
                <Th>Asset</Th>
                <Th>Out to</Th>
                <Th>Type</Th>
                <Th>Checked out</Th>
                <Th>Expected return</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const overdue =
                  row.dueAt != null && row.dueAt < now;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-border-subtle hover:bg-surface-muted/40"
                  >
                    <Td>
                      <Link
                        href={`/assets/${row.asset.id}`}
                        className="asset-tag font-medium"
                      >
                        {row.asset.tag}
                      </Link>
                    </Td>
                    <Td>
                      <span className="text-text">{row.asset.name}</span>
                      {row.asset.brand || row.asset.model ? (
                        <span className="text-text-subtle ml-2 text-[11px]">
                          {[row.asset.brand, row.asset.model].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </Td>
                    <Td>{targetLabel(row)}</Td>
                    <Td>
                      <Badge tone="muted" size="sm">
                        {targetKind(row)}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="text-text-muted text-[11.5px]">
                        {formatDate(row.checkedOutAt)}
                      </span>
                    </Td>
                    <Td>
                      {row.dueAt ? (
                        <span className={overdue ? "text-danger-fg" : "text-text-muted"}>
                          {formatDate(row.dueAt)}
                        </span>
                      ) : (
                        <span className="text-text-subtle">No date</span>
                      )}
                    </Td>
                    <Td>
                      {overdue ? (
                        <Badge tone="danger" size="sm">
                          Overdue
                        </Badge>
                      ) : (
                        <Badge tone="info" size="sm">
                          Out
                        </Badge>
                      )}
                    </Td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-text-muted py-12 text-center text-[12.5px]">
                    Nothing is currently checked out.
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-[0.06em]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 align-middle">{children}</td>;
}

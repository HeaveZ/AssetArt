import type { Metadata } from "next";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { requireSession } from "@/backend/session";
import { listAssets } from "@/backend/services/assets";
import { ReportShell } from "@/frontend/components/features/reports/report-shell";
import { PrintButton } from "@/frontend/components/features/reports/print-button";
import { AssetStatusBadge } from "@/frontend/components/common/status-badge";
import { Button } from "@/frontend/components/ui/button";
import { formatDate, formatMoney } from "@/shared/format";

export const metadata: Metadata = { title: "Asset inventory · Reports" };

export default async function AssetInventoryReportPage() {
  const session = await requireSession();
  const list = await listAssets(session.workspaceId, {
    page: 1,
    pageSize: 500,
    sort: "tag",
    order: "asc",
  });

  return (
    <ReportShell
      title="Asset inventory"
      category="Asset reports"
      description="Every active asset in this workspace, oldest tag first. Use Print for an Excel-friendly snapshot."
      rowCount={list.total}
      actions={
        <>
          <Button asChild variant="secondary" size="sm">
            <Link href="/assets">
              <Boxes /> Open assets
            </Link>
          </Button>
          <PrintButton />
        </>
      }
    >
      <div className="bg-surface overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <Th>Tag</Th>
                <Th>Name</Th>
                <Th>Brand · Model</Th>
                <Th>Serial</Th>
                <Th>Status</Th>
                <Th>Category</Th>
                <Th>Assignee</Th>
                <Th>Purchased</Th>
                <Th align="right">Value</Th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-t border-border-subtle hover:bg-surface-muted/40">
                  <Td>
                    <Link href={`/assets/${row.id}`} className="asset-tag font-medium">
                      {row.tag}
                    </Link>
                  </Td>
                  <Td>
                    <span className="text-text">{row.name}</span>
                  </Td>
                  <Td>
                    {row.brand || row.model ? (
                      <span className="text-text">
                        {[row.brand, row.model].filter(Boolean).join(" · ")}
                      </span>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </Td>
                  <Td>
                    {row.serialNumber ? (
                      <span className="num text-[11.5px] tabular-nums">{row.serialNumber}</span>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </Td>
                  <Td>
                    <AssetStatusBadge status={row.status} />
                  </Td>
                  <Td>{row.category?.name ?? <span className="text-text-subtle">—</span>}</Td>
                  <Td>
                    {row.assignee?.name ?? row.assignee?.email ?? (
                      <span className="text-text-subtle">—</span>
                    )}
                  </Td>
                  <Td>
                    {row.purchaseDate ? (
                      <span className="text-text-muted text-[11.5px]">
                        {formatDate(row.purchaseDate)}
                      </span>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="num tabular-nums font-medium">
                      {formatMoney(row.purchasePrice, row.currency)}
                    </span>
                  </Td>
                </tr>
              ))}
              {list.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-text-muted py-12 text-center text-[12.5px]"
                  >
                    No assets in this workspace yet.
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


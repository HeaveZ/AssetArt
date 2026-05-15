"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import { ArrowUpDown, Columns3, Download, Loader2 } from "lucide-react";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { cn } from "@/frontend/lib/utils";
import { downloadBase64, MIME } from "@/frontend/lib/file";
import { exportAssetsAction } from "@/backend/actions/assets";
import type { AssetFiltersInput } from "@/shared/schemas/asset";
import type { AssetListRow } from "@/backend/services/assets";
import {
  ASSET_COLUMN_IDS,
  buildAssetColumns,
  type AssetColumnMeta,
} from "./asset-table-columns";
import { AssetTablePaginator } from "./asset-table-paginator";

interface Props {
  rows: AssetListRow[];
  total: number;
  page: number;
  pageSize: number;
  currentFilters: AssetFiltersInput;
}

export function AssetTable({ rows, total, page, pageSize, currentFilters }: Props) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useQueryStates({
    sort: parseAsStringEnum(["createdAt", "tag", "name", "purchasePrice", "warrantyEndsAt"])
      .withDefault("createdAt")
      .withOptions({ shallow: false }),
    order: parseAsStringEnum(["asc", "desc"]).withDefault("desc").withOptions({ shallow: false }),
    q: parseAsString.withDefault(""),
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ASSET_COLUMN_IDS.map((id) => [id, true])),
  );
  const [exporting, setExporting] = useState(false);

  const columns = useMemo(() => buildAssetColumns(), []);

  const table = useReactTable({
    data: rows,
    columns,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedRowCount = Object.values(rowSelection).filter(Boolean).length;

  async function handleExport() {
    try {
      setExporting(true);
      const base64 = await exportAssetsAction(currentFilters);
      downloadBase64(base64, MIME.xlsx, `assetart-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Exported", { description: `${rows.length} rows downloaded` });
    } catch (err) {
      toast.error("Export failed", { description: err instanceof Error ? err.message : "Try again" });
    } finally {
      setExporting(false);
    }
  }

  function setSort(column: AssetFiltersInput["sort"]) {
    if (sorting.sort === column) {
      void setSorting({ order: sorting.order === "asc" ? "desc" : "asc" });
    } else {
      void setSorting({ sort: column, order: "desc" });
    }
  }

  return (
    <div className="bg-surface overflow-hidden rounded-xl border">
      <div className="bg-surface-muted/40 flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          {selectedRowCount > 0 ? (
            <span className="text-text-muted text-[11.5px]">
              <span className="text-text font-medium">{selectedRowCount}</span> selected
            </span>
          ) : (
            <span className="text-text-muted text-[11.5px]">
              <span className="text-text num font-medium">{total}</span> assets · page {page} of {totalPages}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={exporting || rows.length === 0}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Columns3 />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().filter((c) => c.id !== "select").map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(Boolean(v))}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="bg-surface-muted text-text-muted">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const meta = (header.column.columnDef.meta ?? {}) as AssetColumnMeta;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "px-3 py-2 text-left font-medium text-[10.5px] uppercase tracking-[0.06em]",
                        meta.align === "right" && "text-right",
                      )}
                    >
                      {meta.sortKey ? (
                        <button
                          type="button"
                          onClick={() => setSort(meta.sortKey!)}
                          className="hover:text-text inline-flex items-center gap-1 transition-colors"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown
                            className={cn(
                              "h-3 w-3 transition-colors",
                              sorting.sort === meta.sortKey ? "text-text" : "text-text-subtle/60",
                            )}
                          />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-text-muted py-12 text-center text-[12.5px]">
                  No assets match these filters.
                </td>
              </tr>
            ) : null}
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i, 12) * 0.015 }}
                className={cn(
                  "border-t border-border-subtle",
                  "transition-colors duration-100",
                  row.getIsSelected() ? "bg-brand-orange-500/5" : "hover:bg-surface-muted/60",
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = (cell.column.columnDef.meta ?? {}) as AssetColumnMeta;
                  return (
                    <td
                      key={cell.id}
                      className={cn("px-3 py-2.5 align-middle", meta.align === "right" && "text-right")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssetTablePaginator total={total} page={page} pageSize={pageSize} />
    </div>
  );
}

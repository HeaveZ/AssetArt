"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import { ArrowUpDown, Columns3, Download, Loader2 } from "lucide-react";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { AssetStatusBadge } from "@/frontend/components/app/status-badge";
import { formatDate, formatMoney, formatSpec } from "@/shared/format";
import { cn } from "@/frontend/lib/utils";
import { exportAssetsAction } from "@/backend/actions/assets";
import type { AssetFiltersInput } from "@/shared/schemas/asset";
import type { AssetListRow } from "@/backend/services/assets";

interface Props {
  rows: AssetListRow[];
  total: number;
  page: number;
  pageSize: number;
  currentFilters: AssetFiltersInput;
}

const COLUMNS_DEFAULT = ["select", "tag", "name", "category", "site", "assignee", "status", "value", "created"];

export function AssetTable({ rows, total, page, pageSize, currentFilters }: Props) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useQueryStates({
    sort: parseAsStringEnum(["createdAt", "tag", "name", "purchasePrice", "warrantyEndsAt"]).withDefault("createdAt").withOptions({ shallow: false }),
    order: parseAsStringEnum(["asc", "desc"]).withDefault("desc").withOptions({ shallow: false }),
    q: parseAsString.withDefault(""),
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COLUMNS_DEFAULT.map((id) => [id, true])),
  );
  const [exporting, setExporting] = useState(false);

  const columns = useMemo<ColumnDef<AssetListRow>[]>(() => buildColumns(sorting.sort, sorting.order), [sorting.sort, sorting.order]);

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
      const blob = base64ToBlob(base64, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evam-assets-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
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
                  const meta = (header.column.columnDef.meta ?? {}) as { sortKey?: AssetFiltersInput["sort"]; align?: "left" | "right" };
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
                            className={cn("h-3 w-3 transition-colors", sorting.sort === meta.sortKey ? "text-text" : "text-text-subtle/60")}
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
                  const meta = (cell.column.columnDef.meta ?? {}) as { align?: "left" | "right" };
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

      {/* Pagination */}
      <Paginator total={total} page={page} pageSize={pageSize} />
    </div>
  );
}

function Paginator({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const [{ page: _p, pageSize: _ps }, setQuery] = useQueryStates({
    page: parseAsString.withDefault("1").withOptions({ shallow: false }),
    pageSize: parseAsString.withDefault(String(pageSize)).withOptions({ shallow: false }),
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="bg-surface-muted/30 text-text-muted flex items-center justify-between gap-3 border-t px-3 py-2 text-[11.5px]">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => setQuery({ pageSize: e.target.value, page: "1" })}
          className="bg-surface text-text h-7 rounded-md border px-1.5 text-[11.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canPrev}
          onClick={() => setQuery({ page: String(page - 1) })}
        >
          Previous
        </Button>
        <span className="num">
          Page <span className="text-text font-medium">{page}</span> of <span className="text-text font-medium">{totalPages}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canNext}
          onClick={() => setQuery({ page: String(page + 1) })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function buildColumns(_sortKey: string, _sortOrder: string): ColumnDef<AssetListRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
          aria-label="Select row"
        />
      ),
      enableHiding: false,
      size: 32,
    },
    {
      id: "tag",
      accessorKey: "tag",
      header: "Tag",
      meta: { sortKey: "tag" },
      cell: ({ row }) => (
        <Link href={`/assets/${row.original.id}`} className="asset-tag font-medium">
          {row.original.tag}
        </Link>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Asset",
      meta: { sortKey: "name" },
      cell: ({ row }) => {
        const spec = formatSpec(row.original.memoryGB, row.original.storageGB);
        return (
          <div className="min-w-[180px]">
            <Link href={`/assets/${row.original.id}`} className="text-text hover:text-info-fg block truncate font-medium leading-tight transition-colors">
              {row.original.name}
            </Link>
            <p className="text-text-subtle truncate text-[11.5px]">
              {[spec, row.original.serialNumber].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) =>
        row.original.category ? (
          <span className="text-text text-[12px]">{row.original.category.name}</span>
        ) : (
          <span className="text-text-subtle">—</span>
        ),
    },
    {
      id: "site",
      header: "Site",
      cell: ({ row }) =>
        row.original.site ? (
          <div className="text-[12px]">
            <p className="text-text">{row.original.site.name}</p>
            {row.original.location ? (
              <p className="text-text-subtle text-[11px]">{row.original.location.name}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-text-subtle">—</span>
        ),
    },
    {
      id: "assignee",
      header: "Assignee",
      cell: ({ row }) =>
        row.original.assignee ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={row.original.assignee.name ?? row.original.assignee.email}
              src={row.original.assignee.image}
              size={22}
            />
            <span className="text-text truncate text-[12px]">
              {row.original.assignee.name ?? row.original.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-text-subtle">—</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <AssetStatusBadge status={row.original.status} />,
    },
    {
      id: "value",
      header: "Value",
      meta: { sortKey: "purchasePrice", align: "right" },
      cell: ({ row }) => (
        <span className="text-text num tabular-nums font-medium">
          {formatMoney(row.original.purchasePrice, row.original.currency)}
        </span>
      ),
    },
    {
      id: "created",
      header: "Created",
      meta: { sortKey: "createdAt" },
      cell: ({ row }) => (
        <span className="text-text-muted text-[11.5px]">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

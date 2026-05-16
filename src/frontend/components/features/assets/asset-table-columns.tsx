"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { AssetStatusBadge } from "@/frontend/components/common/status-badge";
import { formatDate, formatMoney } from "@/shared/format";
import type { AssetFiltersInput } from "@/shared/schemas/asset";
import type { AssetListRow } from "@/backend/services/assets";

export {
  ASSET_COLUMN_IDS,
  DEFAULT_VISIBLE_COLUMNS,
  PINNED_COLUMNS,
  ASSET_COLUMN_LABELS,
  type AssetColumnId,
} from "@/shared/asset-columns";

export type AssetColumnMeta = {
  sortKey?: AssetFiltersInput["sort"];
  align?: "left" | "right" | "center";
  label?: string;
};

const dash = <span className="text-text-subtle">—</span>;

function formatGB(gb: number | null): string | null {
  if (gb == null) return null;
  if (gb >= 1024) {
    const tb = gb / 1024;
    return `${tb % 1 === 0 ? tb.toFixed(0) : tb.toFixed(1)}TB`;
  }
  return `${gb}GB`;
}

export function buildAssetColumns(): ColumnDef<AssetListRow, unknown>[] {
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
      meta: { label: "Select" } satisfies AssetColumnMeta,
    },
    {
      id: "tag",
      accessorKey: "tag",
      header: "Tag",
      meta: { sortKey: "tag", label: "Asset Tag ID" } satisfies AssetColumnMeta,
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
      meta: { sortKey: "name", label: "Asset name" } satisfies AssetColumnMeta,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <Link
            href={`/assets/${row.original.id}`}
            className="text-text hover:text-info-fg block truncate font-medium leading-tight transition-colors"
          >
            {row.original.name}
          </Link>
        </div>
      ),
    },
    {
      id: "brand",
      header: "Brand",
      meta: { label: "Brand" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.brand ? (
          <span className="text-text text-[12px]">{row.original.brand}</span>
        ) : (
          dash
        ),
    },
    {
      id: "model",
      header: "Model",
      meta: { label: "Model" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.model ? (
          <span className="text-text text-[12px]">{row.original.model}</span>
        ) : (
          dash
        ),
    },
    {
      id: "serialNumber",
      header: "Serial",
      meta: { label: "Serial number" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.serialNumber ? (
          <span className="text-text num text-[11.5px] tracking-tight tabular-nums">
            {row.original.serialNumber}
          </span>
        ) : (
          dash
        ),
    },
    {
      id: "assignee",
      header: "Assigned to",
      meta: { label: "Assigned to" } satisfies AssetColumnMeta,
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
          dash
        ),
    },
    {
      id: "category",
      header: "Category",
      meta: { label: "Category" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.category ? (
          <span className="text-text text-[12px]">{row.original.category.name}</span>
        ) : (
          dash
        ),
    },
    {
      id: "site",
      header: "Site",
      meta: { label: "Site" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.site ? (
          <div className="text-[12px]">
            <p className="text-text">{row.original.site.name}</p>
            {row.original.location ? (
              <p className="text-text-subtle text-[11px]">{row.original.location.name}</p>
            ) : null}
          </div>
        ) : (
          dash
        ),
    },
    {
      id: "purchaseDate",
      header: "Purchase date",
      meta: { label: "Purchase date" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.purchaseDate ? (
          <span className="text-text-muted text-[11.5px]">{formatDate(row.original.purchaseDate)}</span>
        ) : (
          dash
        ),
    },
    {
      id: "status",
      header: "Status",
      meta: { label: "Status" } satisfies AssetColumnMeta,
      cell: ({ row }) => <AssetStatusBadge status={row.original.status} />,
    },
    {
      id: "cpu",
      header: "Chip",
      meta: { label: "Chip / CPU" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.cpu ? (
          <span className="text-text text-[12px]">{row.original.cpu}</span>
        ) : (
          dash
        ),
    },
    {
      id: "memory",
      header: "Memory",
      meta: { label: "Memory", align: "right" } satisfies AssetColumnMeta,
      cell: ({ row }) => {
        const v = formatGB(row.original.memoryGB);
        return v ? (
          <span className="text-text num text-[12px] tabular-nums">{v}</span>
        ) : (
          dash
        );
      },
    },
    {
      id: "storage",
      header: "Disk",
      meta: { label: "Storage", align: "right" } satisfies AssetColumnMeta,
      cell: ({ row }) => {
        const v = formatGB(row.original.storageGB);
        return v ? (
          <span className="text-text num text-[12px] tabular-nums">{v}</span>
        ) : (
          dash
        );
      },
    },
    {
      id: "displayInches",
      header: "Display",
      meta: { label: "Display", align: "right" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.displayInches ? (
          <span className="text-text num text-[12px] tabular-nums">{row.original.displayInches}″</span>
        ) : (
          dash
        ),
    },
    {
      id: "os",
      header: "OS",
      meta: { label: "Operating system" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.os ? (
          <span className="text-text text-[12px]">{row.original.os}</span>
        ) : (
          dash
        ),
    },
    {
      id: "description",
      header: "Description",
      meta: { label: "Description" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.description ? (
          <span className="text-text-muted line-clamp-1 max-w-[260px] text-[12px]">
            {row.original.description}
          </span>
        ) : (
          dash
        ),
    },
    {
      id: "value",
      header: "Value",
      meta: { sortKey: "purchasePrice", align: "right", label: "Purchase value" } satisfies AssetColumnMeta,
      cell: ({ row }) => (
        <span className="text-text num tabular-nums font-medium">
          {formatMoney(row.original.purchasePrice, row.original.currency)}
        </span>
      ),
    },
    {
      id: "warranty",
      header: "Warranty",
      meta: { sortKey: "warrantyEndsAt", label: "Warranty ends" } satisfies AssetColumnMeta,
      cell: ({ row }) =>
        row.original.warrantyEndsAt ? (
          <span className="text-text-muted text-[11.5px]">{formatDate(row.original.warrantyEndsAt)}</span>
        ) : (
          dash
        ),
    },
    {
      id: "created",
      header: "Created",
      meta: { sortKey: "createdAt", label: "Created" } satisfies AssetColumnMeta,
      cell: ({ row }) => (
        <span className="text-text-muted text-[11.5px]">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "action",
      header: "",
      enableHiding: false,
      meta: { label: "Action", align: "right" } satisfies AssetColumnMeta,
      cell: ({ row }) => (
        <Link
          href={`/assets/${row.original.id}`}
          className="text-text-muted hover:text-text inline-flex items-center gap-1.5 rounded-md border bg-surface-muted/40 px-2 py-1 text-[11.5px] transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
        >
          <Eye className="h-3 w-3" />
          View
        </Link>
      ),
    },
  ];
}

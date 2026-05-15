"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { AssetStatusBadge } from "@/frontend/components/common/status-badge";
import { formatDate, formatMoney, formatSpec } from "@/shared/format";
import type { AssetFiltersInput } from "@/shared/schemas/asset";
import type { AssetListRow } from "@/backend/services/assets";

export type AssetColumnMeta = {
  sortKey?: AssetFiltersInput["sort"];
  align?: "left" | "right";
};

export const ASSET_COLUMN_IDS = [
  "select",
  "tag",
  "name",
  "category",
  "site",
  "assignee",
  "status",
  "value",
  "created",
] as const;

export function buildAssetColumns(): ColumnDef<AssetListRow>[] {
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
      meta: { sortKey: "tag" } satisfies AssetColumnMeta,
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
      meta: { sortKey: "name" } satisfies AssetColumnMeta,
      cell: ({ row }) => {
        const spec = formatSpec(row.original.memoryGB, row.original.storageGB);
        return (
          <div className="min-w-[180px]">
            <Link
              href={`/assets/${row.original.id}`}
              className="text-text hover:text-info-fg block truncate font-medium leading-tight transition-colors"
            >
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
      meta: { sortKey: "purchasePrice", align: "right" } satisfies AssetColumnMeta,
      cell: ({ row }) => (
        <span className="text-text num tabular-nums font-medium">
          {formatMoney(row.original.purchasePrice, row.original.currency)}
        </span>
      ),
    },
    {
      id: "created",
      header: "Created",
      meta: { sortKey: "createdAt" } satisfies AssetColumnMeta,
      cell: ({ row }) => (
        <span className="text-text-muted text-[11.5px]">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];
}

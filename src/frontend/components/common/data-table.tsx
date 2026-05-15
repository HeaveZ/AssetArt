"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/frontend/lib/utils";

export interface DataTableColumn {
  label: string;
  align?: "left" | "right";
  className?: string;
}

interface DataTableShellProps {
  columns: DataTableColumn[];
  rowCount: number;
  empty: { icon: React.ReactNode; label: string };
  children: React.ReactNode;
}

export function DataTableShell({ columns, rowCount, empty, children }: DataTableShellProps) {
  return (
    <div className="bg-surface overflow-hidden rounded-xl border">
      {rowCount === 0 ? (
        <div className="text-text-muted flex flex-col items-center px-6 py-16 text-[12.5px]">
          <div className="text-text-subtle/60 mb-2 h-5 w-5">{empty.icon}</div>
          {empty.label}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={col.label || i}
                    className={cn(
                      "px-3 py-2 text-[10.5px] font-medium uppercase tracking-[0.06em]",
                      col.align === "right" ? "text-right" : "text-left",
                      col.className,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface DataRowProps extends React.ComponentPropsWithoutRef<typeof motion.tr> {
  index: number;
}

export function DataRow({ index, className, children, ...rest }: DataRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, delay: Math.min(index, 12) * 0.015 }}
      className={cn(
        "border-t border-border-subtle hover:bg-surface-muted/60 transition-colors",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.tr>
  );
}

interface AssetLinkCellProps {
  asset: { id: string; tag: string; name: string };
}

export function AssetLinkCell({ asset }: AssetLinkCellProps) {
  return (
    <td className="px-3 py-2.5">
      <Link
        href={`/assets/${asset.id}`}
        className="flex items-center gap-2 text-text hover:text-info-fg"
      >
        <span className="asset-tag text-[11px]">{asset.tag}</span>
        <span className="truncate font-medium">{asset.name}</span>
      </Link>
    </td>
  );
}

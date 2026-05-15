"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { AssetStatus } from "@prisma/client";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { AssetStatusBadge } from "@/frontend/components/app/status-badge";
import { formatMoney, formatSpec, timeAgo } from "@/shared/format";
import { cn } from "@/frontend/lib/utils";

export type RecentAsset = {
  id: string;
  tag: string;
  name: string;
  brand: string | null;
  model: string | null;
  memoryGB: number | null;
  storageGB: number | null;
  status: AssetStatus;
  purchasePrice: string | null;
  currency: string;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  siteName: string | null;
  createdAt: Date;
};

export function RecentAssetsCard({ assets }: { assets: RecentAsset[] }) {
  return (
    <section className="bg-surface overflow-hidden rounded-xl border">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="space-y-0.5">
          <h2 className="text-text text-[13.5px] font-medium tracking-tight">Recent assets</h2>
          <p className="text-text-muted text-[11.5px]">Most recently created across your workspace.</p>
        </div>
        <Link
          href="/assets"
          className="text-text-muted hover:text-text inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {assets.length === 0 ? (
        <div className="p-8 text-center text-[12.5px] text-text-muted">
          No assets yet. Run <code className="font-mono text-[11px]">pnpm db:seed</code> to populate.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] tabular-nums">
            <thead>
              <tr className="text-text-muted bg-surface-muted/50 text-[10.5px] uppercase tracking-[0.06em]">
                <th className="px-4 py-2.5 text-left font-medium">Tag</th>
                <th className="px-4 py-2.5 text-left font-medium">Asset</th>
                <th className="px-4 py-2.5 text-left font-medium">Assignee</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, i) => {
                const spec = formatSpec(asset.memoryGB, asset.storageGB);
                return (
                  <motion.tr
                    key={asset.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: 0.04 * i, ease: [0.25, 1, 0.5, 1] }}
                    className={cn(
                      "group/row border-t border-border-subtle transition-colors",
                      "hover:bg-surface-muted/60",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/assets/${asset.id}`} className="asset-tag font-medium">
                        {asset.tag}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-text font-medium leading-tight">{asset.name}</div>
                      <div className="text-text-subtle text-[11.5px]">
                        {spec ?? asset.siteName ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {asset.assignee ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={asset.assignee.name ?? asset.assignee.email}
                            src={asset.assignee.image}
                            size={22}
                          />
                          <span className="text-text">{asset.assignee.name ?? asset.assignee.email}</span>
                        </div>
                      ) : (
                        <span className="text-text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <AssetStatusBadge status={asset.status} />
                    </td>
                    <td className="text-text px-4 py-2.5 text-right font-medium">
                      {formatMoney(asset.purchasePrice, asset.currency)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {assets.length > 0 ? (
        <footer className="text-text-subtle bg-surface-muted/40 flex items-center justify-between border-t px-4 py-2 text-[11px]">
          <span>Sorted by created date · last 10</span>
          <span>Updated {timeAgo(new Date())}</span>
        </footer>
      ) : null}
    </section>
  );
}

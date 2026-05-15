"use client";

import { motion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CheckCircle2,
  CirclePlus,
  Pencil,
  Trash2,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";

const ACTION_META: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  "asset.created":      { label: "created",       icon: CirclePlus,     tone: "text-success-fg" },
  "asset.updated":      { label: "updated",       icon: Pencil,         tone: "text-info-fg" },
  "asset.deleted":      { label: "deleted",       icon: Trash2,         tone: "text-danger-fg" },
  "asset.checked_out":  { label: "checked out",   icon: ArrowUpFromLine,tone: "text-success-fg" },
  "asset.checked_in":   { label: "checked in",    icon: ArrowDownToLine,tone: "text-info-fg" },
  "asset.transferred":  { label: "transferred",   icon: ArrowLeftRight, tone: "text-info-fg" },
  "maintenance.scheduled": { label: "scheduled maintenance", icon: Wrench, tone: "text-warning-fg" },
  "maintenance.completed": { label: "completed maintenance", icon: CheckCircle2, tone: "text-success-fg" },
};

export type ActivityItem = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date;
  actor: { id: string; name: string | null; email: string; image: string | null };
  payload: unknown;
};

function payloadAsRecord(p: unknown): Record<string, unknown> {
  return p && typeof p === "object" ? (p as Record<string, unknown>) : {};
}

export function ActivityFeedCard({ items }: { items: ActivityItem[] }) {
  return (
    <section className="bg-surface rounded-xl border">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="space-y-0.5">
          <h2 className="text-text text-[13.5px] font-medium tracking-tight">Recent activity</h2>
          <p className="text-text-muted text-[11.5px]">Audit log · last 8 entries</p>
        </div>
        <span className="live-dot" aria-hidden />
      </header>

      {items.length === 0 ? (
        <div className="text-text-muted p-8 text-center text-[12.5px]">No activity yet.</div>
      ) : (
        <ol className="px-4 py-2">
          {items.map((item, i) => {
            const meta = ACTION_META[item.action] ?? { label: item.action, icon: Pencil, tone: "text-text-muted" };
            const Icon = meta.icon;
            const target = payloadAsRecord(item.payload);
            const tag = (target.tag as string | undefined) ?? null;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.04 * i }}
                className="group/item flex items-start gap-2.5 py-2.5 border-b border-border-subtle last:border-b-0"
              >
                <UserAvatar
                  name={item.actor.name ?? item.actor.email}
                  src={item.actor.image}
                  size={26}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-text text-[12.5px] leading-snug">
                    <span className="font-medium">{item.actor.name ?? item.actor.email}</span>{" "}
                    <span className="text-text-muted">{meta.label}</span>{" "}
                    {tag ? (
                      <span className="asset-tag font-medium">{tag}</span>
                    ) : (
                      <span className="text-text-muted">{item.resourceType}</span>
                    )}
                  </p>
                  <p className="text-text-subtle text-[11px] mt-0.5">{timeAgo(item.createdAt)}</p>
                </div>
                <Icon className={`mt-1 h-3.5 w-3.5 shrink-0 ${meta.tone}`} />
              </motion.li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

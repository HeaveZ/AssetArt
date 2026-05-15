"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { cn } from "@/frontend/lib/utils";
import { formatDateTime, timeAgo } from "@/shared/format";
import type { ActivityFacets, ActivityRow } from "@/backend/services/activity";

interface Props {
  rows: ActivityRow[];
  facets: ActivityFacets;
  total: number;
  page: number;
  pageSize: number;
}

const ALL_VALUE = "__all__";

export function ActivityPageFeed({ rows, facets, total, page, pageSize }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === ALL_VALUE) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.replace(`/activity${params.toString() ? `?${params}` : ""}`);
  }

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(Math.max(1, Math.min(totalPages, next))));
    router.replace(`/activity${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label className="mb-1 text-[11.5px]">Actor</Label>
          <Select
            value={searchParams.get("actorId") ?? ALL_VALUE}
            onValueChange={(v) => setParam("actorId", v)}
          >
            <SelectTrigger className="h-8 text-[12.5px]">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Any actor</SelectItem>
              {facets.actors.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name ?? a.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 text-[11.5px]">Action</Label>
          <Select
            value={searchParams.get("action") ?? ALL_VALUE}
            onValueChange={(v) => setParam("action", v)}
          >
            <SelectTrigger className="h-8 text-[12.5px]">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Any action</SelectItem>
              {facets.actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 text-[11.5px]">Resource</Label>
          <Select
            value={searchParams.get("resourceType") ?? ALL_VALUE}
            onValueChange={(v) => setParam("resourceType", v)}
          >
            <SelectTrigger className="h-8 text-[12.5px]">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Any type</SelectItem>
              {facets.resourceTypes.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 text-[11.5px]">From</Label>
          <Input
            type="date"
            value={searchParams.get("from") ?? ""}
            onChange={(e) => setParam("from", e.target.value || null)}
            className="h-8 text-[12.5px]"
          />
        </div>
        <div>
          <Label className="mb-1 text-[11.5px]">To</Label>
          <Input
            type="date"
            value={searchParams.get("to") ?? ""}
            onChange={(e) => setParam("to", e.target.value || null)}
            className="h-8 text-[12.5px]"
          />
        </div>
      </div>

      <div className="bg-surface overflow-hidden rounded-xl border">
        <div className="border-b px-3 py-2 text-[11.5px]">
          <span className="text-text-muted">
            <span className="text-text num font-medium">{total}</span> event{total === 1 ? "" : "s"}
            {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
          </span>
        </div>
        {rows.length === 0 ? (
          <div className="text-text-muted flex flex-col items-center px-6 py-16 text-[12.5px]">
            <Activity className="text-text-subtle/60 mb-2 h-5 w-5" />
            No activity matches these filters.
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((row, i) => {
              const link = resourceLink(row.resourceType, row.resourceId);
              return (
                <motion.li
                  key={row.id}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14, delay: Math.min(i, 18) * 0.008 }}
                  className="hover:bg-surface-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <UserAvatar
                      name={row.actor.name ?? row.actor.email}
                      src={row.actor.image}
                      size={22}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-text text-[12.5px]">
                        <span className="font-medium">{row.actor.name ?? row.actor.email}</span>
                        <span className="text-text-muted"> · </span>
                        <span className={cn("rounded px-1 py-px text-[11px] font-medium", actionTone(row.action))}>
                          {row.action}
                        </span>
                        {link ? (
                          <>
                            {" "}
                            <Link href={link} className="text-info-fg hover:underline">
                              {row.resourceType}:{shortId(row.resourceId)}
                            </Link>
                          </>
                        ) : (
                          <span className="text-text-muted"> {row.resourceType}:{shortId(row.resourceId)}</span>
                        )}
                      </p>
                      <p className="text-text-subtle text-[11px]" title={formatDateTime(row.createdAt)}>
                        {timeAgo(row.createdAt)} · {formatDateTime(row.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 ? (
          <div className="bg-surface-muted/30 text-text-muted flex items-center justify-between gap-3 border-t px-3 py-2 text-[11.5px]">
            <span className="num">
              Page <span className="text-text font-medium">{page}</span> of{" "}
              <span className="text-text font-medium">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft />
                Previous
              </Button>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function resourceLink(type: string, id: string): string | null {
  switch (type) {
    case "asset":
      return `/assets/${id}`;
    case "lease":
      return "/leases";
    case "maintenance":
      return "/maintenance";
    case "license":
      return "/licenses";
    default:
      return null;
  }
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 6)}…` : id;
}

function actionTone(action: string): string {
  if (action.endsWith("created") || action.endsWith("checked_in")) return "bg-success-bg text-success-fg";
  if (action.endsWith("deleted") || action.endsWith("disposed") || action.endsWith("cancelled")) return "bg-danger-bg text-danger-fg";
  if (action.endsWith("checked_out") || action.includes("overdue")) return "bg-warning-bg text-warning-fg";
  return "bg-surface-muted text-text-muted";
}

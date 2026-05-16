import "server-only";
import type { Prisma, AlertSeverity, AlertType } from "@prisma/client";
import { prisma } from "@/backend/db";
import { ALERT_WINDOW_DAYS } from "@/shared/constants";
import { alertFiltersSchema, type AlertFiltersInput } from "@/shared/schemas/alert";

export type AlertRow = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  resourceType: string | null;
  resourceId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type AlertListResult = {
  rows: AlertRow[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
};

const DAY_MS = 86_400_000;

export async function listAlerts(
  workspaceId: string,
  filters: AlertFiltersInput,
): Promise<AlertListResult> {
  const parsed = alertFiltersSchema.parse(filters);
  const where: Prisma.AlertWhereInput = {
    workspaceId,
    dismissedAt: null,
  };
  if (parsed.type?.length) where.type = { in: parsed.type };
  if (parsed.severity?.length) where.severity = { in: parsed.severity };
  if (parsed.read === "UNREAD") where.readAt = null;
  if (parsed.read === "READ") where.readAt = { not: null };

  const skip = (parsed.page - 1) * parsed.pageSize;

  const [rows, total, unreadCount] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      skip,
      take: parsed.pageSize,
    }),
    prisma.alert.count({ where }),
    prisma.alert.count({ where: { workspaceId, dismissedAt: null, readAt: null } }),
  ]);

  return {
    rows,
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    unreadCount,
  };
}

export async function getUnreadAlertCount(workspaceId: string): Promise<number> {
  return prisma.alert.count({ where: { workspaceId, dismissedAt: null, readAt: null } });
}

// Severity ladder for time-windowed alerts (warranty / lease / license).
function daysSeverity(days: number): AlertSeverity {
  if (days <= 14) return "CRITICAL";
  if (days <= 30) return "WARNING";
  return "INFO";
}

// Idempotent helper: skip if open alert already exists, otherwise insert.
async function ensureAlert(params: {
  workspaceId: string;
  type: AlertType;
  resourceType: string;
  resourceId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
}): Promise<boolean> {
  const existing = await prisma.alert.findFirst({
    where: {
      workspaceId: params.workspaceId,
      type: params.type,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      dismissedAt: null,
    },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.alert.create({
    data: {
      workspaceId: params.workspaceId,
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
    },
  });
  return true;
}

async function generateWarrantyAlerts(workspaceId: string, now: Date): Promise<number> {
  const windowEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.WARRANTY_EXPIRING * DAY_MS);
  const assets = await prisma.asset.findMany({
    where: { workspaceId, deletedAt: null, warrantyEndsAt: { gte: now, lte: windowEnd } },
    select: { id: true, tag: true, name: true, warrantyEndsAt: true },
  });
  let created = 0;
  for (const a of assets) {
    if (!a.warrantyEndsAt) continue;
    const days = Math.ceil((a.warrantyEndsAt.getTime() - now.getTime()) / DAY_MS);
    const inserted = await ensureAlert({
      workspaceId,
      type: "WARRANTY_EXPIRING",
      resourceType: "asset",
      resourceId: a.id,
      severity: daysSeverity(days),
      title: `Warranty ending in ${days}d — ${a.tag}`,
      message: `${a.name} warranty ends ${a.warrantyEndsAt.toISOString().slice(0, 10)}.`,
    });
    if (inserted) created++;
  }
  return created;
}

async function generateLeaseAlerts(workspaceId: string, now: Date): Promise<number> {
  const windowEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.LEASE_EXPIRING * DAY_MS);
  const leases = await prisma.lease.findMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      status: { in: ["ACTIVE", "EXPIRING"] },
      endDate: { gte: now, lte: windowEnd },
    },
    include: { asset: { select: { tag: true, name: true } } },
  });
  let created = 0;
  for (const l of leases) {
    if (l.status === "ACTIVE") {
      await prisma.lease.update({ where: { id: l.id }, data: { status: "EXPIRING" } });
    }
    const days = Math.ceil((l.endDate.getTime() - now.getTime()) / DAY_MS);
    const inserted = await ensureAlert({
      workspaceId,
      type: "LEASE_EXPIRING",
      resourceType: "lease",
      resourceId: l.id,
      severity: daysSeverity(days),
      title: `Lease ending in ${days}d — ${l.asset.tag}`,
      message: `${l.vendor} lease for ${l.asset.name} ends ${l.endDate.toISOString().slice(0, 10)}.`,
    });
    if (inserted) created++;
  }
  return created;
}

async function generateMaintenanceAlerts(workspaceId: string, now: Date): Promise<number> {
  const windowEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.MAINTENANCE_DUE * DAY_MS);
  const records = await prisma.maintenanceRecord.findMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      status: { in: ["SCHEDULED", "OVERDUE"] },
      scheduledAt: { lte: windowEnd },
    },
    include: { asset: { select: { tag: true, name: true } } },
  });
  let created = 0;
  for (const m of records) {
    if (!m.scheduledAt) continue;
    const isOverdue = m.status === "OVERDUE";
    const inserted = await ensureAlert({
      workspaceId,
      type: "MAINTENANCE_DUE",
      resourceType: "maintenance",
      resourceId: m.id,
      severity: isOverdue ? "CRITICAL" : "WARNING",
      title: isOverdue
        ? `Maintenance overdue — ${m.asset.tag}`
        : `Maintenance due — ${m.asset.tag}`,
      message: `${m.asset.name} scheduled for ${m.scheduledAt.toISOString().slice(0, 10)}.`,
    });
    if (inserted) created++;
  }
  return created;
}

async function generateLicenseAlerts(workspaceId: string, now: Date): Promise<number> {
  const windowEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.LICENSE_EXPIRING * DAY_MS);
  const licenses = await prisma.license.findMany({
    where: {
      workspaceId,
      status: { in: ["ACTIVE", "EXPIRING"] },
      endDate: { gte: now, lte: windowEnd },
    },
  });
  let created = 0;
  for (const l of licenses) {
    if (!l.endDate) continue;
    if (l.status === "ACTIVE") {
      await prisma.license.update({ where: { id: l.id }, data: { status: "EXPIRING" } });
    }
    const days = Math.ceil((l.endDate.getTime() - now.getTime()) / DAY_MS);
    const inserted = await ensureAlert({
      workspaceId,
      type: "LICENSE_EXPIRING",
      resourceType: "license",
      resourceId: l.id,
      severity: daysSeverity(days),
      title: `License expiring in ${days}d — ${l.name}`,
      message: `${l.name} expires ${l.endDate.toISOString().slice(0, 10)}.`,
    });
    if (inserted) created++;
  }
  return created;
}

async function generateOverdueCheckoutAlerts(workspaceId: string, now: Date): Promise<number> {
  const checkouts = await prisma.checkout.findMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      returnedAt: null,
      dueAt: { lt: now, not: null },
    },
    include: { asset: { select: { id: true, tag: true, name: true } } },
  });
  let created = 0;
  for (const c of checkouts) {
    if (!c.dueAt) continue;
    const days = Math.ceil((now.getTime() - c.dueAt.getTime()) / DAY_MS);
    const inserted = await ensureAlert({
      workspaceId,
      type: "ASSET_OVERDUE",
      resourceType: "asset",
      resourceId: c.asset.id,
      severity: days >= 7 ? "CRITICAL" : "WARNING",
      title: `Asset overdue ${days}d — ${c.asset.tag}`,
      message: `${c.asset.name} due ${c.dueAt.toISOString().slice(0, 10)}, not returned.`,
    });
    if (inserted) created++;
  }
  return created;
}

/**
 * Idempotent generator. Scans assets, leases, licenses, maintenance and
 * ensures appropriate alerts exist. Returns the number of new alerts created.
 */
export async function regenerateAllAlerts(workspaceId: string): Promise<number> {
  const now = new Date();
  const counts = await Promise.all([
    generateWarrantyAlerts(workspaceId, now),
    generateLeaseAlerts(workspaceId, now),
    generateMaintenanceAlerts(workspaceId, now),
    generateLicenseAlerts(workspaceId, now),
    generateOverdueCheckoutAlerts(workspaceId, now),
  ]);
  return counts.reduce((sum, n) => sum + n, 0);
}

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

/**
 * Idempotent generator. Scans assets, leases, licenses, maintenance and
 * ensures appropriate alerts exist. Returns the number of new alerts created.
 */
export async function regenerateAllAlerts(workspaceId: string): Promise<number> {
  const now = new Date();
  let created = 0;

  // ── WARRANTY_EXPIRING ──
  const warrantyEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.WARRANTY_EXPIRING * DAY_MS);
  const warrantyAssets = await prisma.asset.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      warrantyEndsAt: { gte: now, lte: warrantyEnd },
    },
    select: { id: true, tag: true, name: true, warrantyEndsAt: true },
  });
  for (const a of warrantyAssets) {
    if (!a.warrantyEndsAt) continue;
    const existing = await prisma.alert.findFirst({
      where: {
        workspaceId,
        type: "WARRANTY_EXPIRING",
        resourceType: "asset",
        resourceId: a.id,
        dismissedAt: null,
      },
      select: { id: true },
    });
    if (existing) continue;
    const days = Math.ceil((a.warrantyEndsAt.getTime() - now.getTime()) / DAY_MS);
    await prisma.alert.create({
      data: {
        workspaceId,
        type: "WARRANTY_EXPIRING",
        severity: days <= 14 ? "CRITICAL" : days <= 30 ? "WARNING" : "INFO",
        title: `Warranty ending in ${days}d — ${a.tag}`,
        message: `${a.name} warranty ends ${a.warrantyEndsAt.toISOString().slice(0, 10)}.`,
        resourceType: "asset",
        resourceId: a.id,
      },
    });
    created++;
  }

  // ── LEASE_EXPIRING ──
  const leaseEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.LEASE_EXPIRING * DAY_MS);
  const expiringLeases = await prisma.lease.findMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      status: { in: ["ACTIVE", "EXPIRING"] },
      endDate: { gte: now, lte: leaseEnd },
    },
    include: { asset: { select: { tag: true, name: true } } },
  });
  for (const l of expiringLeases) {
    if (l.status === "ACTIVE") {
      await prisma.lease.update({ where: { id: l.id }, data: { status: "EXPIRING" } });
    }
    const existing = await prisma.alert.findFirst({
      where: {
        workspaceId,
        type: "LEASE_EXPIRING",
        resourceType: "lease",
        resourceId: l.id,
        dismissedAt: null,
      },
      select: { id: true },
    });
    if (existing) continue;
    const days = Math.ceil((l.endDate.getTime() - now.getTime()) / DAY_MS);
    await prisma.alert.create({
      data: {
        workspaceId,
        type: "LEASE_EXPIRING",
        severity: days <= 14 ? "CRITICAL" : days <= 30 ? "WARNING" : "INFO",
        title: `Lease ending in ${days}d — ${l.asset.tag}`,
        message: `${l.vendor} lease for ${l.asset.name} ends ${l.endDate.toISOString().slice(0, 10)}.`,
        resourceType: "lease",
        resourceId: l.id,
      },
    });
    created++;
  }

  // ── MAINTENANCE_DUE ──
  const maintEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.MAINTENANCE_DUE * DAY_MS);
  const dueMaintenance = await prisma.maintenanceRecord.findMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      status: { in: ["SCHEDULED", "OVERDUE"] },
      scheduledAt: { lte: maintEnd },
    },
    include: { asset: { select: { tag: true, name: true } } },
  });
  for (const m of dueMaintenance) {
    if (!m.scheduledAt) continue;
    const existing = await prisma.alert.findFirst({
      where: {
        workspaceId,
        type: "MAINTENANCE_DUE",
        resourceType: "maintenance",
        resourceId: m.id,
        dismissedAt: null,
      },
      select: { id: true },
    });
    if (existing) continue;
    const isOverdue = m.status === "OVERDUE";
    await prisma.alert.create({
      data: {
        workspaceId,
        type: "MAINTENANCE_DUE",
        severity: isOverdue ? "CRITICAL" : "WARNING",
        title: isOverdue
          ? `Maintenance overdue — ${m.asset.tag}`
          : `Maintenance due — ${m.asset.tag}`,
        message: `${m.asset.name} scheduled for ${m.scheduledAt.toISOString().slice(0, 10)}.`,
        resourceType: "maintenance",
        resourceId: m.id,
      },
    });
    created++;
  }

  // ── LICENSE_EXPIRING ──
  const licenseEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.LICENSE_EXPIRING * DAY_MS);
  const expiringLicenses = await prisma.license.findMany({
    where: {
      workspaceId,
      status: { in: ["ACTIVE", "EXPIRING"] },
      endDate: { gte: now, lte: licenseEnd },
    },
  });
  for (const l of expiringLicenses) {
    if (!l.endDate) continue;
    if (l.status === "ACTIVE") {
      await prisma.license.update({ where: { id: l.id }, data: { status: "EXPIRING" } });
    }
    const existing = await prisma.alert.findFirst({
      where: {
        workspaceId,
        type: "LICENSE_EXPIRING",
        resourceType: "license",
        resourceId: l.id,
        dismissedAt: null,
      },
      select: { id: true },
    });
    if (existing) continue;
    const days = Math.ceil((l.endDate.getTime() - now.getTime()) / DAY_MS);
    await prisma.alert.create({
      data: {
        workspaceId,
        type: "LICENSE_EXPIRING",
        severity: days <= 14 ? "CRITICAL" : days <= 30 ? "WARNING" : "INFO",
        title: `License expiring in ${days}d — ${l.name}`,
        message: `${l.name} expires ${l.endDate.toISOString().slice(0, 10)}.`,
        resourceType: "license",
        resourceId: l.id,
      },
    });
    created++;
  }

  // ── ASSET_OVERDUE ──
  const overdueCheckouts = await prisma.checkout.findMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      returnedAt: null,
      dueAt: { lt: now, not: null },
    },
    include: { asset: { select: { id: true, tag: true, name: true } } },
  });
  for (const c of overdueCheckouts) {
    if (!c.dueAt) continue;
    const existing = await prisma.alert.findFirst({
      where: {
        workspaceId,
        type: "ASSET_OVERDUE",
        resourceType: "asset",
        resourceId: c.asset.id,
        dismissedAt: null,
      },
      select: { id: true },
    });
    if (existing) continue;
    const days = Math.ceil((now.getTime() - c.dueAt.getTime()) / DAY_MS);
    await prisma.alert.create({
      data: {
        workspaceId,
        type: "ASSET_OVERDUE",
        severity: days >= 7 ? "CRITICAL" : "WARNING",
        title: `Asset overdue ${days}d — ${c.asset.tag}`,
        message: `${c.asset.name} due ${c.dueAt.toISOString().slice(0, 10)}, not returned.`,
        resourceType: "asset",
        resourceId: c.asset.id,
      },
    });
    created++;
  }

  return created;
}

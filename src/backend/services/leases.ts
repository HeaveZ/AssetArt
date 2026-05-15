import "server-only";
import type { Prisma, LeaseStatus } from "@prisma/client";
import { prisma } from "@/backend/db";
import { ALERT_WINDOW_DAYS } from "@/shared/constants";
import type { LeaseSegment } from "@/shared/schemas/lease";

export type LeaseRow = {
  id: string;
  vendor: string;
  contractRef: string | null;
  startDate: Date;
  endDate: Date;
  monthlyCost: string;
  currency: string;
  autoRenew: boolean;
  status: LeaseStatus;
  daysToEnd: number;
  asset: { id: string; tag: string; name: string };
};

export type LeaseListResult = {
  rows: LeaseRow[];
  total: number;
  counts: Record<LeaseSegment, number>;
};

export type LeaseAssetOption = { id: string; tag: string; name: string };

const DAY_MS = 86_400_000;

export async function listLeases(
  workspaceId: string,
  segment: LeaseSegment | "ALL" = "ALL",
): Promise<LeaseListResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.LEASE_EXPIRING * DAY_MS);

  const baseWhere: Prisma.LeaseWhereInput = {
    asset: { workspaceId, deletedAt: null },
  };

  const segmentWhere: Record<LeaseSegment, Prisma.LeaseWhereInput> = {
    ACTIVE: { ...baseWhere, status: "ACTIVE", endDate: { gt: windowEnd } },
    EXPIRING: { ...baseWhere, status: { in: ["ACTIVE", "EXPIRING"] }, endDate: { gte: now, lte: windowEnd } },
    ENDED: { ...baseWhere, OR: [{ status: { in: ["ENDED", "CANCELLED"] } }, { endDate: { lt: now } }] },
  };

  const where = segment === "ALL" ? baseWhere : segmentWhere[segment];

  const [rows, counts] = await Promise.all([
    prisma.lease.findMany({
      where,
      orderBy: { endDate: "asc" },
      take: 200,
      include: { asset: { select: { id: true, tag: true, name: true } } },
    }),
    Promise.all([
      prisma.lease.count({ where: segmentWhere.ACTIVE }),
      prisma.lease.count({ where: segmentWhere.EXPIRING }),
      prisma.lease.count({ where: segmentWhere.ENDED }),
    ]),
  ]);

  const [active, expiring, ended] = counts;

  return {
    rows: rows.map((l) => ({
      id: l.id,
      vendor: l.vendor,
      contractRef: l.contractRef,
      startDate: l.startDate,
      endDate: l.endDate,
      monthlyCost: l.monthlyCost.toString(),
      currency: l.currency,
      autoRenew: l.autoRenew,
      status: l.status,
      daysToEnd: Math.ceil((l.endDate.getTime() - now.getTime()) / DAY_MS),
      asset: l.asset,
    })),
    total: rows.length,
    counts: { ACTIVE: active, EXPIRING: expiring, ENDED: ended },
  };
}

export async function getLeaseAssetOptions(workspaceId: string): Promise<LeaseAssetOption[]> {
  // Assets without a lease already
  const rows = await prisma.asset.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      status: { not: "DISPOSED" },
      lease: null,
    },
    select: { id: true, tag: true, name: true },
    orderBy: { tag: "asc" },
    take: 500,
  });
  return rows;
}

/**
 * Idempotent — for every lease ending within the warning window, ensure a
 * LEASE_EXPIRING alert exists and the lease status reflects it.
 */
export async function regenerateLeaseExpiryAlerts(workspaceId: string): Promise<number> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.LEASE_EXPIRING * DAY_MS);

  const expiring = await prisma.lease.findMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      status: { in: ["ACTIVE", "EXPIRING"] },
      endDate: { gte: now, lte: windowEnd },
    },
    include: { asset: { select: { id: true, tag: true, name: true } } },
  });

  let created = 0;
  for (const lease of expiring) {
    if (lease.status === "ACTIVE") {
      await prisma.lease.update({
        where: { id: lease.id },
        data: { status: "EXPIRING" },
      });
    }
    const existing = await prisma.alert.findFirst({
      where: {
        workspaceId,
        type: "LEASE_EXPIRING",
        resourceType: "lease",
        resourceId: lease.id,
        dismissedAt: null,
      },
      select: { id: true },
    });
    if (existing) continue;

    const days = Math.ceil((lease.endDate.getTime() - now.getTime()) / DAY_MS);
    await prisma.alert.create({
      data: {
        workspaceId,
        type: "LEASE_EXPIRING",
        severity: days <= 14 ? "CRITICAL" : days <= 30 ? "WARNING" : "INFO",
        title: `Lease ending in ${days}d — ${lease.asset.tag}`,
        message: `${lease.vendor} lease for ${lease.asset.name} ends ${lease.endDate.toISOString().slice(0, 10)}.`,
        resourceType: "lease",
        resourceId: lease.id,
      },
    });
    created++;
  }

  // Mark anything past endDate as ENDED.
  await prisma.lease.updateMany({
    where: {
      asset: { workspaceId },
      status: { in: ["ACTIVE", "EXPIRING"] },
      endDate: { lt: now },
    },
    data: { status: "ENDED" },
  });

  return created;
}

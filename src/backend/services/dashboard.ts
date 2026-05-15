import "server-only";
import { prisma } from "@/backend/db";
import type { AssetStatus, AlertSeverity, AlertType } from "@prisma/client";

export type DashboardSummary = {
  totals: {
    totalAssets: number;
    checkedOut: number;
    inMaintenance: number;
    overdueMaintenance: number;
    portfolioValue: number;
    portfolioCurrency: string;
  };
  statusMix: { status: AssetStatus; count: number }[];
  categoryMix: { name: string; count: number }[];
  recentAssets: Array<{
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
  }>;
  activity: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string;
    createdAt: Date;
    actor: { id: string; name: string | null; email: string; image: string | null };
    payload: unknown;
  }>;
  alerts: Array<{
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    resourceType: string | null;
    resourceId: string | null;
    createdAt: Date;
  }>;
  trends: {
    assetsCreated: number[];
    checkouts: number[];
    maintenance: number[];
  };
  weekDiff: {
    newAssets: { current: number; previous: number };
    checkouts: { current: number; previous: number };
    completedMaintenance: { current: number; previous: number };
  };
};

const EMPTY: DashboardSummary = {
  totals: {
    totalAssets: 0,
    checkedOut: 0,
    inMaintenance: 0,
    overdueMaintenance: 0,
    portfolioValue: 0,
    portfolioCurrency: "USD",
  },
  statusMix: [],
  categoryMix: [],
  recentAssets: [],
  activity: [],
  alerts: [],
  trends: { assetsCreated: [], checkouts: [], maintenance: [] },
  weekDiff: {
    newAssets: { current: 0, previous: 0 },
    checkouts: { current: 0, previous: 0 },
    completedMaintenance: { current: 0, previous: 0 },
  },
};

const TREND_WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getDashboardSummary(workspaceId: string): Promise<DashboardSummary> {
  try {
    const [workspace, totalAssets, checkedOut, inMaintenance, overdueMaintenance, portfolioAgg, statusMix, recentAssets, activity, alerts] =
      await Promise.all([
        prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { currency: true },
        }),
        prisma.asset.count({ where: { workspaceId, deletedAt: null } }),
        prisma.asset.count({ where: { workspaceId, deletedAt: null, status: "CHECKED_OUT" } }),
        prisma.asset.count({ where: { workspaceId, deletedAt: null, status: "IN_MAINTENANCE" } }),
        prisma.maintenanceRecord.count({
          where: {
            asset: { workspaceId, deletedAt: null },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            scheduledAt: { lt: new Date() },
          },
        }),
        prisma.asset.aggregate({
          where: { workspaceId, deletedAt: null, status: { not: "DISPOSED" } },
          _sum: { purchasePrice: true },
        }),
        prisma.asset.groupBy({
          by: ["status"],
          where: { workspaceId, deletedAt: null },
          _count: { _all: true },
        }),
        prisma.asset.findMany({
          where: { workspaceId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            assignee: { select: { id: true, name: true, email: true, image: true } },
            site: { select: { name: true } },
          },
        }),
        prisma.auditLog.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            actor: { select: { id: true, name: true, email: true, image: true } },
          },
        }),
        prisma.alert.findMany({
          where: { workspaceId, readAt: null, dismissedAt: null },
          orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
          take: 5,
        }),
      ]);

    // Category mix (with names)
    const catGroup = await prisma.asset.groupBy({
      by: ["categoryId"],
      where: { workspaceId, deletedAt: null, categoryId: { not: null } },
      _count: { _all: true },
    });
    const catIds = catGroup.map((c) => c.categoryId).filter((id): id is string => Boolean(id));
    const categories = await prisma.category.findMany({
      where: { id: { in: catIds } },
      select: { id: true, name: true },
    });
    const catNameById = new Map(categories.map((c) => [c.id, c.name]));
    const categoryMix = catGroup
      .map((g) => ({ name: g.categoryId ? catNameById.get(g.categoryId) ?? "Uncategorized" : "Uncategorized", count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    const now = Date.now();
    const trendStart = new Date(now - TREND_WEEKS * WEEK_MS);
    const [trendAssets, trendCheckouts, trendMaintenance] = await Promise.all([
      prisma.asset.findMany({
        where: { workspaceId, deletedAt: null, createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      prisma.checkout.findMany({
        where: { asset: { workspaceId, deletedAt: null }, checkedOutAt: { gte: trendStart } },
        select: { checkedOutAt: true },
      }),
      prisma.maintenanceRecord.findMany({
        where: { asset: { workspaceId, deletedAt: null }, createdAt: { gte: trendStart } },
        select: { createdAt: true, status: true, completedAt: true },
      }),
    ]);

    const trends = {
      assetsCreated: bucketByWeek(trendAssets.map((a) => a.createdAt), now),
      checkouts: bucketByWeek(trendCheckouts.map((c) => c.checkedOutAt), now),
      maintenance: bucketByWeek(trendMaintenance.map((m) => m.createdAt), now),
    };

    const weekStart = now - WEEK_MS;
    const prevWeekStart = now - 2 * WEEK_MS;
    const weekDiff = {
      newAssets: countWindow(trendAssets.map((a) => a.createdAt), weekStart, prevWeekStart, now),
      checkouts: countWindow(
        trendCheckouts.map((c) => c.checkedOutAt),
        weekStart,
        prevWeekStart,
        now,
      ),
      completedMaintenance: countWindow(
        trendMaintenance
          .filter((m) => m.status === "COMPLETED" && m.completedAt)
          .map((m) => m.completedAt as Date),
        weekStart,
        prevWeekStart,
        now,
      ),
    };

    return {
      totals: {
        totalAssets,
        checkedOut,
        inMaintenance,
        overdueMaintenance,
        portfolioValue: Number(portfolioAgg._sum.purchasePrice ?? 0),
        portfolioCurrency: workspace?.currency ?? "USD",
      },
      statusMix: statusMix.map((s) => ({ status: s.status, count: s._count._all })),
      categoryMix,
      trends,
      weekDiff,
      recentAssets: recentAssets.map((a) => ({
        id: a.id,
        tag: a.tag,
        name: a.name,
        brand: a.brand,
        model: a.model,
        memoryGB: a.memoryGB,
        storageGB: a.storageGB,
        status: a.status,
        purchasePrice: a.purchasePrice ? a.purchasePrice.toString() : null,
        currency: a.currency,
        assignee: a.assignee,
        siteName: a.site?.name ?? null,
        createdAt: a.createdAt,
      })),
      activity: activity.map((e) => ({
        id: e.id,
        action: e.action,
        resourceType: e.resourceType,
        resourceId: e.resourceId,
        createdAt: e.createdAt,
        actor: e.actor,
        payload: e.payload,
      })),
      alerts,
    };
  } catch (err) {
    console.error("dashboard summary failed:", err);
    return EMPTY;
  }
}

function bucketByWeek(dates: Date[], now: number): number[] {
  const buckets = new Array<number>(TREND_WEEKS).fill(0);
  for (const d of dates) {
    const idx = TREND_WEEKS - 1 - Math.floor((now - d.getTime()) / WEEK_MS);
    if (idx >= 0 && idx < TREND_WEEKS) buckets[idx] = (buckets[idx] ?? 0) + 1;
  }
  return buckets;
}

function countWindow(
  dates: Date[],
  weekStart: number,
  prevWeekStart: number,
  now: number,
): { current: number; previous: number } {
  let current = 0;
  let previous = 0;
  for (const d of dates) {
    const t = d.getTime();
    if (t >= weekStart && t <= now) current += 1;
    else if (t >= prevWeekStart && t < weekStart) previous += 1;
  }
  return { current, previous };
}

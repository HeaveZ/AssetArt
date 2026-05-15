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
};

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

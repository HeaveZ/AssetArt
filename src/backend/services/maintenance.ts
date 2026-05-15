import "server-only";
import type { Prisma, MaintenanceStatus, MaintenanceType } from "@prisma/client";
import { prisma } from "@/backend/db";
import { maintenanceFiltersSchema, type MaintenanceFiltersInput } from "@/shared/schemas/maintenance";

export type MaintenanceRow = {
  id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
  cost: string | null;
  currency: string;
  vendor: string | null;
  description: string | null;
  createdAt: Date;
  asset: { id: string; tag: string; name: string };
};

export type MaintenanceListResult = {
  rows: MaintenanceRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<MaintenanceStatus, number>;
};

export type MaintenanceAssetOption = {
  id: string;
  tag: string;
  name: string;
};

export async function listMaintenance(
  workspaceId: string,
  filters: MaintenanceFiltersInput,
): Promise<MaintenanceListResult> {
  const parsed = maintenanceFiltersSchema.parse(filters);
  const where: Prisma.MaintenanceRecordWhereInput = {
    asset: { workspaceId, deletedAt: null },
  };
  if (parsed.status?.length) where.status = { in: parsed.status };

  const skip = (parsed.page - 1) * parsed.pageSize;

  const [rows, total, grouped] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
      skip,
      take: parsed.pageSize,
      include: { asset: { select: { id: true, tag: true, name: true } } },
    }),
    prisma.maintenanceRecord.count({ where }),
    prisma.maintenanceRecord.groupBy({
      by: ["status"],
      where: { asset: { workspaceId, deletedAt: null } },
      _count: { _all: true },
    }),
  ]);

  const counts: Record<MaintenanceStatus, number> = {
    SCHEDULED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    OVERDUE: 0,
  };
  for (const g of grouped) counts[g.status] = g._count._all;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      scheduledAt: r.scheduledAt,
      completedAt: r.completedAt,
      cost: r.cost ? r.cost.toString() : null,
      currency: r.currency,
      vendor: r.vendor,
      description: r.description,
      createdAt: r.createdAt,
      asset: r.asset,
    })),
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    counts,
  };
}

export async function getMaintenanceAssetOptions(workspaceId: string): Promise<MaintenanceAssetOption[]> {
  const rows = await prisma.asset.findMany({
    where: { workspaceId, deletedAt: null, status: { not: "DISPOSED" } },
    select: { id: true, tag: true, name: true },
    orderBy: { tag: "asc" },
    take: 500,
  });
  return rows;
}

/**
 * Mark SCHEDULED records whose scheduledAt is in the past as OVERDUE.
 * Cron-friendly: idempotent, returns flipped count.
 */
export async function recomputeOverdueMaintenance(workspaceId: string): Promise<number> {
  const now = new Date();
  const result = await prisma.maintenanceRecord.updateMany({
    where: {
      asset: { workspaceId, deletedAt: null },
      status: "SCHEDULED",
      scheduledAt: { lt: now, not: null },
    },
    data: { status: "OVERDUE" },
  });
  return result.count;
}

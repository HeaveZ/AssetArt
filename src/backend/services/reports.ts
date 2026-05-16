import "server-only";
import { prisma } from "@/backend/db";
import type { AssetStatus } from "@prisma/client";

export type StatusReportRow = {
  status: AssetStatus;
  count: number;
  value: string | null;
};

/**
 * Counts and totals grouped by asset status. Used by `/reports/status`.
 */
export async function getStatusReport(workspaceId: string): Promise<StatusReportRow[]> {
  const grouped = await prisma.asset.groupBy({
    by: ["status"],
    where: { workspaceId, deletedAt: null },
    _count: { _all: true },
    _sum: { purchasePrice: true },
  });
  return grouped.map((g) => ({
    status: g.status,
    count: g._count._all,
    value: g._sum.purchasePrice ? g._sum.purchasePrice.toString() : null,
  }));
}

export type ActiveCheckoutRow = {
  id: string;
  checkedOutAt: Date;
  dueAt: Date | null;
  notes: string | null;
  asset: { id: string; tag: string; name: string; brand: string | null; model: string | null };
  toUser: { id: string; name: string | null; email: string } | null;
  toPerson: { id: string; firstName: string; lastName: string | null } | null;
  toSite: { id: string; name: string } | null;
  toCustomer: { id: string; name: string } | null;
};

/**
 * Currently checked-out assets — `Checkout` rows where `returnedAt IS NULL`.
 * Newest first.
 */
export async function getActiveCheckouts(workspaceId: string): Promise<ActiveCheckoutRow[]> {
  const rows = await prisma.checkout.findMany({
    where: {
      returnedAt: null,
      asset: { workspaceId, deletedAt: null },
    },
    orderBy: { checkedOutAt: "desc" },
    take: 500,
    select: {
      id: true,
      checkedOutAt: true,
      dueAt: true,
      notes: true,
      asset: { select: { id: true, tag: true, name: true, brand: true, model: true } },
      toUser: { select: { id: true, name: true, email: true } },
      toPerson: { select: { id: true, firstName: true, lastName: true } },
      toSite: { select: { id: true, name: true } },
      toCustomer: { select: { id: true, name: true } },
    },
  });
  return rows;
}

export type MaintenanceHistoryRow = {
  id: string;
  type: string;
  status: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  cost: string | null;
  description: string | null;
  vendor: string | null;
  asset: { id: string; tag: string; name: string };
};

/**
 * Recent maintenance entries across the workspace.
 */
export async function getMaintenanceHistory(
  workspaceId: string,
): Promise<MaintenanceHistoryRow[]> {
  const rows = await prisma.maintenanceRecord.findMany({
    where: { asset: { workspaceId, deletedAt: null } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      asset: { select: { id: true, tag: true, name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    scheduledAt: r.scheduledAt,
    completedAt: r.completedAt,
    cost: r.cost ? r.cost.toString() : null,
    description: r.description,
    vendor: r.vendor,
    asset: r.asset,
  }));
}

export type ActiveLeaseRow = {
  id: string;
  vendor: string;
  startDate: Date;
  endDate: Date;
  monthlyCost: string;
  currency: string;
  asset: { id: string; tag: string; name: string };
};

/**
 * Currently active leases (status = ACTIVE) for the workspace.
 * Workspace scope is enforced via the related asset, since Lease has no
 * direct workspaceId column.
 */
export async function getActiveLeases(workspaceId: string): Promise<ActiveLeaseRow[]> {
  const rows = await prisma.lease.findMany({
    where: { status: "ACTIVE", asset: { workspaceId, deletedAt: null } },
    orderBy: { endDate: "asc" },
    take: 500,
    include: { asset: { select: { id: true, tag: true, name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    vendor: r.vendor,
    startDate: r.startDate,
    endDate: r.endDate,
    monthlyCost: r.monthlyCost.toString(),
    currency: r.currency,
    asset: r.asset,
  }));
}

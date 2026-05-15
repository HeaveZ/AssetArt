import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/backend/db";
import { assetFiltersSchema, type AssetFiltersInput } from "@/shared/schemas/asset";

export type AssetListResult = {
  rows: AssetListRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AssetListRow = {
  id: string;
  tag: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  status: Prisma.AssetGetPayload<Record<string, never>>["status"];
  memoryGB: number | null;
  storageGB: number | null;
  category: { id: string; name: string } | null;
  site: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  purchasePrice: string | null;
  currency: string;
  warrantyEndsAt: Date | null;
  purchaseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AssetDetail = AssetListRow & {
  description: string | null;
  notes: string | null;
  displayInches: string | null;
  cpu: string | null;
  os: string | null;
};

const SORT_MAP: Record<AssetFiltersInput["sort"], string> = {
  createdAt: "createdAt",
  tag: "tag",
  name: "name",
  purchasePrice: "purchasePrice",
  warrantyEndsAt: "warrantyEndsAt",
};

export async function listAssets(
  workspaceId: string,
  filters: AssetFiltersInput,
): Promise<AssetListResult> {
  const parsed = assetFiltersSchema.parse(filters);
  const where: Prisma.AssetWhereInput = {
    workspaceId,
    deletedAt: null,
  };

  if (parsed.q) {
    where.OR = [
      { tag: { contains: parsed.q, mode: "insensitive" } },
      { name: { contains: parsed.q, mode: "insensitive" } },
      { brand: { contains: parsed.q, mode: "insensitive" } },
      { model: { contains: parsed.q, mode: "insensitive" } },
      { serialNumber: { contains: parsed.q, mode: "insensitive" } },
      { notes: { contains: parsed.q, mode: "insensitive" } },
    ];
  }
  if (parsed.status?.length) where.status = { in: parsed.status };
  if (parsed.siteId?.length) where.siteId = { in: parsed.siteId };
  if (parsed.categoryId?.length) where.categoryId = { in: parsed.categoryId };
  if (parsed.assigneeId?.length) where.assigneeId = { in: parsed.assigneeId };

  const skip = (parsed.page - 1) * parsed.pageSize;
  const sortKey = SORT_MAP[parsed.sort];

  const [rows, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { [sortKey]: parsed.order },
      skip,
      take: parsed.pageSize,
      include: {
        category: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    rows: rows.map((a) => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      brand: a.brand,
      model: a.model,
      serialNumber: a.serialNumber,
      status: a.status,
      memoryGB: a.memoryGB,
      storageGB: a.storageGB,
      category: a.category,
      site: a.site,
      location: a.location,
      assignee: a.assignee,
      purchasePrice: a.purchasePrice ? a.purchasePrice.toString() : null,
      currency: a.currency,
      warrantyEndsAt: a.warrantyEndsAt,
      purchaseDate: a.purchaseDate,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
  };
}

export async function getAssetDetail(workspaceId: string, id: string) {
  const asset = await prisma.asset.findFirst({
    where: { id, workspaceId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      photos: { orderBy: { order: "asc" } },
      lease: true,
      checkouts: {
        orderBy: { checkedOutAt: "desc" },
        include: {
          toUser: { select: { id: true, name: true, email: true, image: true } },
          toPerson: { select: { id: true, firstName: true, lastName: true, email: true } },
          toSite: { select: { id: true, name: true } },
          toCustomer: { select: { id: true, name: true } },
        },
      },
      maintenance: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!asset) return null;

  const auditLogs = await prisma.auditLog.findMany({
    where: { workspaceId, resourceType: "asset", resourceId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true, email: true, image: true } } },
  });

  return { ...asset, auditLogs };
}

import type { AssetStatus } from "@prisma/client";

export interface RelatedAsset {
  id: string;
  tag: string;
  name: string;
  status: AssetStatus;
  brand: string | null;
  model: string | null;
}

export async function listRelatedAssets(
  workspaceId: string,
  assetId: string,
  filters: { categoryId: string | null; siteId: string | null },
): Promise<RelatedAsset[]> {
  if (!filters.categoryId && !filters.siteId) return [];
  return prisma.asset.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      id: { not: assetId },
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.siteId ? { siteId: filters.siteId } : {}),
    },
    take: 6,
    orderBy: { updatedAt: "desc" },
    select: { id: true, tag: true, name: true, status: true, brand: true, model: true },
  });
}

export type AssetFacets = {
  sites: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  assignees: { id: string; name: string | null; email: string; image: string | null }[];
};

export async function getAssetFacets(workspaceId: string): Promise<AssetFacets> {
  const [sites, categories, assignees] = await Promise.all([
    prisma.site.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true, email: true, image: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { sites, categories, assignees };
}

export type AssetFormData = {
  sites: { id: string; name: string }[];
  locations: { id: string; name: string; siteId: string }[];
  categories: { id: string; name: string }[];
  assignees: { id: string; name: string | null; email: string }[];
};

export async function getAssetFormData(workspaceId: string): Promise<AssetFormData> {
  const [sites, locations, categories, assignees] = await Promise.all([
    prisma.site.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { site: { workspaceId } },
      select: { id: true, name: true, siteId: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { sites, locations, categories, assignees };
}

export async function getAssetForEdit(workspaceId: string, id: string) {
  return prisma.asset.findFirst({
    where: { id, workspaceId, deletedAt: null },
    select: {
      id: true,
      tag: true,
      name: true,
      brand: true,
      model: true,
      serialNumber: true,
      description: true,
      categoryId: true,
      siteId: true,
      locationId: true,
      assigneeId: true,
      status: true,
      purchaseDate: true,
      purchasePrice: true,
      currency: true,
      warrantyEndsAt: true,
      cpu: true,
      memoryGB: true,
      storageGB: true,
      displayInches: true,
      os: true,
      notes: true,
    },
  });
}

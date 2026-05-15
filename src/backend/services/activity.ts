import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/backend/db";
import { activityFiltersSchema, type ActivityFiltersInput } from "@/shared/schemas/activity";

export type ActivityRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  actor: { id: string; name: string | null; email: string; image: string | null };
};

export type ActivityListResult = {
  rows: ActivityRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type ActivityFacets = {
  actors: { id: string; name: string | null; email: string }[];
  actions: string[];
  resourceTypes: string[];
};

export async function listActivity(
  workspaceId: string,
  filters: ActivityFiltersInput,
): Promise<ActivityListResult> {
  const parsed = activityFiltersSchema.parse(filters);
  const where: Prisma.AuditLogWhereInput = { workspaceId };
  if (parsed.actorId) where.actorId = parsed.actorId;
  if (parsed.action) where.action = parsed.action;
  if (parsed.resourceType) where.resourceType = parsed.resourceType;
  if (parsed.from || parsed.to) {
    where.createdAt = {
      ...(parsed.from ? { gte: parsed.from } : {}),
      ...(parsed.to ? { lte: parsed.to } : {}),
    };
  }

  const skip = (parsed.page - 1) * parsed.pageSize;

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parsed.pageSize,
      include: { actor: { select: { id: true, name: true, email: true, image: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total, page: parsed.page, pageSize: parsed.pageSize };
}

export async function getActivityFacets(workspaceId: string): Promise<ActivityFacets> {
  const [actors, actions, resourceTypes] = await Promise.all([
    prisma.user.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.auditLog
      .findMany({
        where: { workspaceId },
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      })
      .then((rows) => rows.map((r) => r.action)),
    prisma.auditLog
      .findMany({
        where: { workspaceId },
        select: { resourceType: true },
        distinct: ["resourceType"],
        orderBy: { resourceType: "asc" },
      })
      .then((rows) => rows.map((r) => r.resourceType)),
  ]);
  return { actors, actions, resourceTypes };
}

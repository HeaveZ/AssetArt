import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = Prisma.TransactionClient | PrismaClient;

export type AuditPayload = {
  workspaceId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(db: Db, payload: AuditPayload): Promise<void> {
  await db.auditLog.create({
    data: {
      workspaceId: payload.workspaceId,
      actorId: payload.actorId,
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      payload: payload.payload,
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? null,
    },
  });
}

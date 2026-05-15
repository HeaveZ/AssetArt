"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/backend/db";
import { requireSession } from "@/backend/session";
import { requirePermission } from "@/shared/permissions";
import { writeAudit } from "@/backend/lib/audit";
import { recomputeOverdueMaintenance } from "@/backend/services/maintenance";
import {
  completeMaintenanceSchema,
  createMaintenanceSchema,
  type CompleteMaintenanceInput,
  type CreateMaintenanceInput,
} from "@/shared/schemas/maintenance";
import type { ActionResult } from "@/shared/types";

export async function createMaintenanceAction(
  input: CreateMaintenanceInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "maintenance.create");

  const parsed = createMaintenanceSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input", field: issue?.path?.[0]?.toString() };
  }
  const data = parsed.data;

  try {
    const recordId = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findFirst({
        where: { id: data.assetId, workspaceId: session.workspaceId, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!asset) throw new Error("Asset not found");

      const isOverdue = data.scheduledAt ? data.scheduledAt.getTime() < Date.now() : false;
      const record = await tx.maintenanceRecord.create({
        data: {
          assetId: asset.id,
          type: data.type,
          status: isOverdue ? "OVERDUE" : "SCHEDULED",
          scheduledAt: data.scheduledAt ?? null,
          vendor: data.vendor || null,
          description: data.description || null,
          cost: data.cost ?? null,
          currency: data.currency ?? "USD",
          createdBy: session.userId,
        },
      });

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "maintenance.scheduled",
        resourceType: "maintenance",
        resourceId: record.id,
        payload: {
          assetId: asset.id,
          type: data.type,
          scheduledAt: data.scheduledAt?.toISOString() ?? null,
        },
      });
      return record.id;
    });

    revalidatePath("/maintenance");
    revalidatePath(`/assets/${data.assetId}`);
    return { ok: true, data: { id: recordId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not schedule maintenance" };
  }
}

export async function startMaintenanceAction(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "maintenance.update");

  try {
    await prisma.$transaction(async (tx) => {
      const rec = await tx.maintenanceRecord.findFirst({
        where: { id, asset: { workspaceId: session.workspaceId } },
        select: { id: true, assetId: true, status: true },
      });
      if (!rec) throw new Error("Maintenance record not found");
      if (rec.status === "COMPLETED" || rec.status === "CANCELLED") {
        throw new Error(`Cannot start a ${rec.status.toLowerCase()} record`);
      }

      await tx.maintenanceRecord.update({
        where: { id: rec.id },
        data: { status: "IN_PROGRESS" },
      });
      await tx.asset.update({
        where: { id: rec.assetId },
        data: { status: "IN_MAINTENANCE" },
      });

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "maintenance.started",
        resourceType: "maintenance",
        resourceId: rec.id,
      });
    });

    revalidatePath("/maintenance");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not start maintenance" };
  }
}

export async function completeMaintenanceAction(
  input: CompleteMaintenanceInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "maintenance.update");

  const parsed = completeMaintenanceSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const rec = await tx.maintenanceRecord.findFirst({
        where: { id: data.id, asset: { workspaceId: session.workspaceId } },
        select: { id: true, assetId: true, status: true },
      });
      if (!rec) throw new Error("Maintenance record not found");
      if (rec.status === "COMPLETED") throw new Error("Already completed");

      await tx.maintenanceRecord.update({
        where: { id: rec.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          cost: data.cost ?? undefined,
          description: data.notes ? data.notes : undefined,
        },
      });

      // Flip asset back to AVAILABLE if currently in maintenance.
      const asset = await tx.asset.findUnique({
        where: { id: rec.assetId },
        select: { status: true },
      });
      if (asset?.status === "IN_MAINTENANCE") {
        await tx.asset.update({
          where: { id: rec.assetId },
          data: { status: "AVAILABLE" },
        });
      }

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "maintenance.completed",
        resourceType: "maintenance",
        resourceId: rec.id,
        payload: { cost: data.cost ?? null },
      });
    });

    revalidatePath("/maintenance");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not complete maintenance" };
  }
}

export async function cancelMaintenanceAction(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "maintenance.update");

  try {
    await prisma.$transaction(async (tx) => {
      const rec = await tx.maintenanceRecord.findFirst({
        where: { id, asset: { workspaceId: session.workspaceId } },
        select: { id: true, assetId: true, status: true },
      });
      if (!rec) throw new Error("Maintenance record not found");
      if (rec.status === "COMPLETED") throw new Error("Cannot cancel a completed record");

      await tx.maintenanceRecord.update({
        where: { id: rec.id },
        data: { status: "CANCELLED" },
      });

      const asset = await tx.asset.findUnique({
        where: { id: rec.assetId },
        select: { status: true },
      });
      if (asset?.status === "IN_MAINTENANCE") {
        await tx.asset.update({
          where: { id: rec.assetId },
          data: { status: "AVAILABLE" },
        });
      }

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "maintenance.cancelled",
        resourceType: "maintenance",
        resourceId: rec.id,
      });
    });

    revalidatePath("/maintenance");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not cancel maintenance" };
  }
}

export async function recomputeOverdueMaintenanceAction(): Promise<ActionResult<{ flipped: number }>> {
  const session = await requireSession();
  requirePermission(session.role, "maintenance.update");
  const flipped = await recomputeOverdueMaintenance(session.workspaceId);
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return { ok: true, data: { flipped } };
}

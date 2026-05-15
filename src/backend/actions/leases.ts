"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/backend/db";
import { requireSession } from "@/backend/session";
import { requirePermission } from "@/shared/permissions";
import { writeAudit } from "@/backend/lib/audit";
import { regenerateLeaseExpiryAlerts } from "@/backend/services/leases";
import {
  cancelLeaseSchema,
  createLeaseSchema,
  type CreateLeaseInput,
} from "@/shared/schemas/lease";
import { ALERT_WINDOW_DAYS } from "@/shared/constants";
import type { ActionResult } from "@/shared/types";

const DAY_MS = 86_400_000;

export async function createLeaseAction(input: CreateLeaseInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "lease.create");

  const parsed = createLeaseSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input", field: issue?.path?.[0]?.toString() };
  }
  const data = parsed.data;

  try {
    const id = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findFirst({
        where: { id: data.assetId, workspaceId: session.workspaceId, deletedAt: null },
        select: { id: true, lease: { select: { id: true } } },
      });
      if (!asset) throw new Error("Asset not found");
      if (asset.lease) throw new Error("Asset already has a lease");

      const now = new Date();
      const windowEnd = new Date(now.getTime() + ALERT_WINDOW_DAYS.LEASE_EXPIRING * DAY_MS);
      const isExpiring = data.endDate <= windowEnd;
      const status = data.endDate < now ? "ENDED" : isExpiring ? "EXPIRING" : "ACTIVE";

      const lease = await tx.lease.create({
        data: {
          assetId: asset.id,
          vendor: data.vendor,
          contractRef: data.contractRef || null,
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyCost: data.monthlyCost,
          currency: data.currency ?? "USD",
          autoRenew: data.autoRenew,
          notes: data.notes || null,
          status,
        },
      });

      await tx.asset.update({
        where: { id: asset.id },
        data: { status: "LEASED" },
      });

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "lease.created",
        resourceType: "lease",
        resourceId: lease.id,
        payload: {
          assetId: asset.id,
          vendor: data.vendor,
          endDate: data.endDate.toISOString(),
        },
      });

      return lease.id;
    });

    // Regenerate alerts so the expiring window is reflected.
    await regenerateLeaseExpiryAlerts(session.workspaceId);

    revalidatePath("/leases");
    revalidatePath("/alerts");
    revalidatePath(`/assets/${data.assetId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create lease" };
  }
}

export async function cancelLeaseAction(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "lease.update");

  const parsed = cancelLeaseSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  try {
    await prisma.$transaction(async (tx) => {
      const lease = await tx.lease.findFirst({
        where: { id, asset: { workspaceId: session.workspaceId } },
        select: { id: true, assetId: true, status: true },
      });
      if (!lease) throw new Error("Lease not found");
      if (lease.status === "CANCELLED" || lease.status === "ENDED") throw new Error("Already closed");

      await tx.lease.update({
        where: { id: lease.id },
        data: { status: "CANCELLED" },
      });
      await tx.asset.update({
        where: { id: lease.assetId },
        data: { status: "AVAILABLE" },
      });
      await tx.alert.updateMany({
        where: { resourceType: "lease", resourceId: lease.id, dismissedAt: null },
        data: { dismissedAt: new Date() },
      });

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "lease.cancelled",
        resourceType: "lease",
        resourceId: lease.id,
      });
    });

    revalidatePath("/leases");
    revalidatePath("/alerts");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not cancel lease" };
  }
}

export async function regenerateLeaseAlertsAction(): Promise<ActionResult<{ created: number }>> {
  const session = await requireSession();
  requirePermission(session.role, "lease.update");
  const created = await regenerateLeaseExpiryAlerts(session.workspaceId);
  revalidatePath("/leases");
  revalidatePath("/alerts");
  return { ok: true, data: { created } };
}

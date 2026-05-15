"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/backend/db";
import { requireSession } from "@/backend/session";
import { requirePermission } from "@/shared/permissions";
import { writeAudit } from "@/backend/lib/audit";
import {
  checkinInputSchema,
  checkoutInputSchema,
  type CheckinInput,
  type CheckoutInput,
} from "@/shared/schemas/checkout";
import type { ActionResult } from "@/shared/types";

const TARGET_FIELD = {
  USER: "toUserId",
  PERSON: "toPersonId",
  SITE: "toSiteId",
  CUSTOMER: "toCustomerId",
} as const;

export async function checkoutAssetsAction(
  input: CheckoutInput,
): Promise<ActionResult<{ checkedOut: number }>> {
  const session = await requireSession();
  requirePermission(session.role, "checkout.create");

  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input", field: issue?.path?.[0]?.toString() };
  }
  const data = parsed.data;
  const targetField = TARGET_FIELD[data.target];

  try {
    const count = await prisma.$transaction(async (tx) => {
      const assets = await tx.asset.findMany({
        where: {
          id: { in: data.assetIds },
          workspaceId: session.workspaceId,
          deletedAt: null,
          status: { in: ["AVAILABLE", "RESERVED"] },
        },
        select: { id: true },
      });
      if (assets.length === 0) throw new Error("None of the selected assets are available");
      if (assets.length !== data.assetIds.length) {
        throw new Error(`${data.assetIds.length - assets.length} asset(s) were no longer available — refresh and retry`);
      }

      // Verify the target exists in this workspace
      await assertTargetInWorkspace(tx, session.workspaceId, data.target, data.targetId);

      for (const asset of assets) {
        await tx.checkout.create({
          data: {
            assetId: asset.id,
            toType: data.target,
            [targetField]: data.targetId,
            checkedOutBy: session.userId,
            dueAt: data.dueAt ?? null,
            notes: data.notes || null,
          },
        });
        await tx.asset.update({
          where: { id: asset.id },
          data: {
            status: "CHECKED_OUT",
            assigneeId: data.target === "USER" ? data.targetId : null,
          },
        });
        await writeAudit(tx, {
          workspaceId: session.workspaceId,
          actorId: session.userId,
          action: "asset.checked_out",
          resourceType: "asset",
          resourceId: asset.id,
          payload: {
            target: data.target,
            targetId: data.targetId,
            dueAt: data.dueAt?.toISOString() ?? null,
          },
        });
      }
      return assets.length;
    });

    revalidatePath("/checkout");
    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { ok: true, data: { checkedOut: count } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Checkout failed" };
  }
}

export async function checkinAssetsAction(
  input: CheckinInput,
): Promise<ActionResult<{ checkedIn: number }>> {
  const session = await requireSession();
  requirePermission(session.role, "checkout.return");

  const parsed = checkinInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input", field: issue?.path?.[0]?.toString() };
  }
  const data = parsed.data;

  try {
    const count = await prisma.$transaction(async (tx) => {
      const activeCheckouts = await tx.checkout.findMany({
        where: {
          assetId: { in: data.assetIds },
          returnedAt: null,
          asset: { workspaceId: session.workspaceId },
        },
        select: { id: true, assetId: true },
      });
      if (activeCheckouts.length === 0) throw new Error("No active checkouts found for those assets");

      for (const co of activeCheckouts) {
        await tx.checkout.update({
          where: { id: co.id },
          data: {
            returnedAt: new Date(),
            returnedBy: session.userId,
            notes: data.notes ? `${data.notes}` : undefined,
          },
        });
        await tx.asset.update({
          where: { id: co.assetId },
          data: { status: "AVAILABLE", assigneeId: null },
        });
        await writeAudit(tx, {
          workspaceId: session.workspaceId,
          actorId: session.userId,
          action: "asset.checked_in",
          resourceType: "asset",
          resourceId: co.assetId,
          payload: { checkoutId: co.id },
        });
      }
      return activeCheckouts.length;
    });

    revalidatePath("/checkin");
    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { ok: true, data: { checkedIn: count } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Check-in failed" };
  }
}

async function assertTargetInWorkspace(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  workspaceId: string,
  target: CheckoutInput["target"],
  targetId: string,
): Promise<void> {
  const found = await (async () => {
    switch (target) {
      case "USER":
        return tx.user.findFirst({ where: { id: targetId, workspaceId, deletedAt: null }, select: { id: true } });
      case "PERSON":
        return tx.person.findFirst({ where: { id: targetId, workspaceId }, select: { id: true } });
      case "SITE":
        return tx.site.findFirst({ where: { id: targetId, workspaceId }, select: { id: true } });
      case "CUSTOMER":
        return tx.customer.findFirst({ where: { id: targetId, workspaceId }, select: { id: true } });
    }
  })();
  if (!found) throw new Error("Target not found in this workspace");
}

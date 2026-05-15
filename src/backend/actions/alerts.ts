"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/backend/db";
import { requireSession } from "@/backend/session";
import { requirePermission } from "@/shared/permissions";
import { regenerateAllAlerts } from "@/backend/services/alerts";
import type { ActionResult } from "@/shared/types";

export async function markAlertReadAction(
  id: string,
  read = true,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "alert.read");

  await prisma.alert.updateMany({
    where: { id, workspaceId: session.workspaceId },
    data: { readAt: read ? new Date() : null },
  });
  revalidatePath("/alerts");
  return { ok: true, data: { id } };
}

export async function dismissAlertsAction(
  ids: string[],
): Promise<ActionResult<{ dismissed: number }>> {
  const session = await requireSession();
  requirePermission(session.role, "alert.dismiss");

  if (ids.length === 0) return { ok: false, error: "No alerts selected" };
  const result = await prisma.alert.updateMany({
    where: { id: { in: ids }, workspaceId: session.workspaceId, dismissedAt: null },
    data: { dismissedAt: new Date() },
  });
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { ok: true, data: { dismissed: result.count } };
}

export async function markAllAlertsReadAction(): Promise<ActionResult<{ updated: number }>> {
  const session = await requireSession();
  requirePermission(session.role, "alert.read");
  const result = await prisma.alert.updateMany({
    where: { workspaceId: session.workspaceId, dismissedAt: null, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { ok: true, data: { updated: result.count } };
}

export async function regenerateAlertsAction(): Promise<ActionResult<{ created: number }>> {
  const session = await requireSession();
  requirePermission(session.role, "alert.read");
  const created = await regenerateAllAlerts(session.workspaceId);
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { ok: true, data: { created } };
}

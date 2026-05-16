import "server-only";
import { prisma } from "@/backend/db";
import { z } from "zod";
import { ASSET_COLUMN_IDS } from "@/shared/asset-columns";

/** Reserved view name used for the implicit per-user column layout. */
const COLUMN_PREFS_NAME = "__column-prefs__";

const assetColumnsPayloadSchema = z.object({
  visible: z.array(z.enum(ASSET_COLUMN_IDS)).min(1).max(ASSET_COLUMN_IDS.length),
  order: z.array(z.enum(ASSET_COLUMN_IDS)).min(1).max(ASSET_COLUMN_IDS.length),
});

export type AssetColumnPrefs = z.infer<typeof assetColumnsPayloadSchema>;

/**
 * Load the current user's asset table column preferences.
 * Returns null when the user has never saved a layout (UI falls back to defaults).
 */
export async function getMyAssetColumnPrefs(
  workspaceId: string,
  ownerId: string,
): Promise<AssetColumnPrefs | null> {
  const row = await prisma.savedView.findFirst({
    where: { workspaceId, ownerId, resource: "ASSET", name: COLUMN_PREFS_NAME },
    select: { columns: true },
  });
  if (!row?.columns) return null;
  const parsed = assetColumnsPayloadSchema.safeParse(row.columns);
  if (!parsed.success) return null;
  return parsed.data;
}

/**
 * Upsert the user's asset table column preferences.
 * Validates against `ASSET_COLUMN_IDS` so a tampered payload can never reach storage.
 */
export async function saveMyAssetColumnPrefs(
  workspaceId: string,
  ownerId: string,
  payload: unknown,
): Promise<AssetColumnPrefs> {
  const data = assetColumnsPayloadSchema.parse(payload);

  const existing = await prisma.savedView.findFirst({
    where: { workspaceId, ownerId, resource: "ASSET", name: COLUMN_PREFS_NAME },
    select: { id: true },
  });

  if (existing) {
    await prisma.savedView.update({
      where: { id: existing.id },
      data: { columns: data, filters: {} },
    });
  } else {
    await prisma.savedView.create({
      data: {
        workspaceId,
        ownerId,
        resource: "ASSET",
        name: COLUMN_PREFS_NAME,
        filters: {},
        columns: data,
      },
    });
  }

  return data;
}

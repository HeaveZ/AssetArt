"use server";

import { requireSession } from "@/backend/session";
import {
  getMyAssetColumnPrefs,
  saveMyAssetColumnPrefs,
  type AssetColumnPrefs,
} from "@/backend/services/saved-views";
import type { ActionResult } from "@/shared/types";

/**
 * Persist the current user's Asset table column layout.
 *
 * Security:
 * - Requires session (ownerId is always the authenticated user).
 * - The payload is validated against the canonical ASSET_COLUMN_IDS in the
 *   service layer; unknown column ids are rejected.
 * - The row is scoped to (workspaceId, ownerId), so one user can never read
 *   or overwrite another user's layout.
 */
export async function saveAssetColumnPrefsAction(
  payload: unknown,
): Promise<ActionResult<AssetColumnPrefs>> {
  const session = await requireSession();
  try {
    const data = await saveMyAssetColumnPrefs(session.workspaceId, session.userId, payload);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save layout",
    };
  }
}

/**
 * Read the current user's Asset table column layout (or null when unset).
 * Exposed as an action so a client component can lazy-load it after mount.
 */
export async function loadAssetColumnPrefsAction(): Promise<AssetColumnPrefs | null> {
  const session = await requireSession();
  return getMyAssetColumnPrefs(session.workspaceId, session.userId);
}

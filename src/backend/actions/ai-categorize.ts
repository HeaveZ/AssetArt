"use server";

import { requireSession } from "@/backend/session";
import { requirePermission } from "@/shared/permissions";
import {
  AiNotConfiguredError,
  suggestAssetCategorization,
} from "@/backend/services/ai-categorize";
import {
  aiCategorizeInputSchema,
  type AiCategorizeInput,
  type AiCategorizeResult,
} from "@/shared/schemas/asset";
import type { ActionResult } from "@/shared/types";

export async function aiCategorizeAction(
  input: AiCategorizeInput,
): Promise<ActionResult<AiCategorizeResult>> {
  const session = await requireSession();
  requirePermission(session.role, "asset.create");

  const parsed = aiCategorizeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid AI input" };
  }
  // At least one identifying field
  if (!parsed.data.brand && !parsed.data.model && !parsed.data.serialNumber && !parsed.data.name) {
    return { ok: false, error: "Provide a brand, model, or serial number first." };
  }

  try {
    const result = await suggestAssetCategorization(parsed.data);
    return { ok: true, data: result };
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return {
        ok: false,
        error: "AI is not configured. Set ANTHROPIC_API_KEY in your environment.",
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AI request failed",
    };
  }
}

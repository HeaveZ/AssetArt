import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  aiCategorizeResultSchema,
  type AiCategorizeInput,
  type AiCategorizeResult,
} from "@/shared/schemas/asset";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are an IT asset cataloging assistant for an enterprise asset management product. Given a brand, model, and optional serial number, infer the most likely category, technical specs, OS, an approximate USD price, and a typical manufacturer warranty term.

Rules:
- Output ONLY a single JSON object — no prose, no markdown, no preamble.
- Choose a category from this controlled vocabulary when possible: "Laptops", "Mac", "PC", "Phones", "Monitors", "Peripherals", "Servers", "Tablets", "Network", "Storage", "Accessories".
- "Mac" or "PC" must be used INSTEAD OF "Laptops" when you are confident it is a portable computer; "Laptops" otherwise.
- memoryGB and storageGB must be integers in GB. Use a single representative spec — the most common SKU for that model.
- displayInches is the screen size for laptops/monitors/phones. Omit for desktops and peripherals.
- estimatedPriceUsd is the typical new street price in USD.
- estimatedWarrantyYears is the typical manufacturer warranty in whole years (commonly 1, 2, or 3).
- confidence is your overall confidence as a float between 0 and 1.
- Omit fields you have no opinion about — never invent.

Schema:
{
  "categoryName"?: string,
  "os"?: string,
  "cpu"?: string,
  "memoryGB"?: number,
  "storageGB"?: number,
  "displayInches"?: number,
  "estimatedPriceUsd"?: number,
  "estimatedWarrantyYears"?: number,
  "notes"?: string,
  "confidence"?: number
}`;

let _client: Anthropic | null = null;
function client(): Anthropic | null {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  _client = new Anthropic({ apiKey });
  return _client;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "AiNotConfiguredError";
  }
}

function stripFence(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

export async function suggestAssetCategorization(
  input: AiCategorizeInput,
): Promise<AiCategorizeResult> {
  const c = client();
  if (!c) throw new AiNotConfiguredError();

  const userParts: string[] = [];
  if (input.brand) userParts.push(`Brand: ${input.brand}`);
  if (input.model) userParts.push(`Model: ${input.model}`);
  if (input.serialNumber) userParts.push(`Serial: ${input.serialNumber}`);
  if (input.name) userParts.push(`Name: ${input.name}`);
  if (userParts.length === 0) {
    return { confidence: 0 };
  }

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 0.1,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: userParts.join("\n"),
      },
    ],
  });

  // Extract first text block
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return { confidence: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(block.text));
  } catch {
    return { confidence: 0, notes: "Could not parse model response" };
  }

  const validated = aiCategorizeResultSchema.safeParse(parsed);
  if (!validated.success) {
    return { confidence: 0, notes: "Model returned an unexpected shape" };
  }
  return validated.data;
}

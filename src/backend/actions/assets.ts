"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/backend/db";
import { requireSession } from "@/backend/session";
import { requirePermission } from "@/shared/permissions";
import { writeAudit } from "@/backend/services/audit";
import { exportAssetsXlsx } from "@/backend/services/excel-export";
import { listAssets } from "@/backend/services/assets";
import {
  createAssetSchema,
  csvImportRowSchema,
  CSV_TEMPLATE_HEADERS,
  updateAssetSchema,
  type CreateAssetInput,
  type UpdateAssetInput,
  type AssetFiltersInput,
} from "@/shared/schemas/asset";
import { parseCsv } from "@/backend/services/csv";
import type { ActionResult } from "@/shared/types";

export type CsvImportSummary = {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; tag?: string; reason: string }>;
};

async function generateNextTag(workspaceId: string, tx: Prisma.TransactionClient): Promise<string> {
  const latest = await tx.asset.findMany({
    where: { workspaceId, tag: { startsWith: "E" } },
    orderBy: { tag: "desc" },
    take: 30,
    select: { tag: true },
  });
  let maxN = 1400;
  for (const a of latest) {
    const n = parseInt(a.tag.slice(1), 10);
    if (!Number.isNaN(n) && n > maxN) maxN = n;
  }
  const next = maxN + 1;
  return `E${String(next).padStart(4, "0")}`;
}

function clean<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === "" || v === undefined) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export async function createAssetAction(
  _prev: ActionResult | null,
  formData: FormData | CreateAssetInput,
): Promise<ActionResult<{ id: string; tag: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "asset.create");

  const raw = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData;
  const parsed = createAssetSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input", field: issue?.path?.[0]?.toString() };
  }

  const input = parsed.data;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const tag = input.tag?.trim() || (await generateNextTag(session.workspaceId, tx));
      const conflict = await tx.asset.findFirst({
        where: { workspaceId: session.workspaceId, tag, deletedAt: null },
        select: { id: true },
      });
      if (conflict) throw new Error(`Tag ${tag} is already in use`);

      const asset = await tx.asset.create({
        data: {
          workspaceId: session.workspaceId,
          tag,
          name: input.name,
          status: input.status ?? "AVAILABLE",
          currency: input.currency ?? "USD",
          ...clean({
            brand: input.brand,
            model: input.model,
            serialNumber: input.serialNumber,
            description: input.description,
            categoryId: input.categoryId,
            siteId: input.siteId,
            locationId: input.locationId,
            assigneeId: input.assigneeId,
            purchaseDate: input.purchaseDate,
            purchasePrice: input.purchasePrice,
            warrantyEndsAt: input.warrantyEndsAt,
            cpu: input.cpu,
            memoryGB: input.memoryGB,
            storageGB: input.storageGB,
            displayInches: input.displayInches,
            os: input.os,
            notes: input.notes,
          }),
        },
        select: { id: true, tag: true, name: true },
      });

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "asset.created",
        resourceType: "asset",
        resourceId: asset.id,
        payload: { tag: asset.tag, name: asset.name },
      });

      return asset;
    });

    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: result.id, tag: result.tag } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create asset" };
  }
}

export async function updateAssetAction(
  id: string,
  input: UpdateAssetInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "asset.update");

  const parsed = updateAssetSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input", field: issue?.path?.[0]?.toString() };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.asset.findFirst({
        where: { id, workspaceId: session.workspaceId, deletedAt: null },
        select: { id: true, tag: true },
      });
      if (!existing) throw new Error("Asset not found");

      await tx.asset.update({
        where: { id },
        data: clean({
          name: parsed.data.name,
          brand: parsed.data.brand,
          model: parsed.data.model,
          serialNumber: parsed.data.serialNumber,
          description: parsed.data.description,
          categoryId: parsed.data.categoryId,
          siteId: parsed.data.siteId,
          locationId: parsed.data.locationId,
          assigneeId: parsed.data.assigneeId,
          status: parsed.data.status,
          purchaseDate: parsed.data.purchaseDate,
          purchasePrice: parsed.data.purchasePrice,
          warrantyEndsAt: parsed.data.warrantyEndsAt,
          cpu: parsed.data.cpu,
          memoryGB: parsed.data.memoryGB,
          storageGB: parsed.data.storageGB,
          displayInches: parsed.data.displayInches,
          os: parsed.data.os,
          notes: parsed.data.notes,
        }),
      });

      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "asset.updated",
        resourceType: "asset",
        resourceId: existing.id,
        payload: { tag: existing.tag, fields: Object.keys(clean(parsed.data)) },
      });
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${id}`);
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update asset" };
  }
}

export async function deleteAssetAction(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  requirePermission(session.role, "asset.delete");

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.asset.findFirst({
        where: { id, workspaceId: session.workspaceId, deletedAt: null },
        select: { id: true, tag: true, name: true },
      });
      if (!existing) throw new Error("Asset not found");
      await tx.asset.update({ where: { id }, data: { deletedAt: new Date() } });
      await writeAudit(tx, {
        workspaceId: session.workspaceId,
        actorId: session.userId,
        action: "asset.deleted",
        resourceType: "asset",
        resourceId: existing.id,
        payload: { tag: existing.tag, name: existing.name },
      });
    });

    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete asset" };
  }
}

export async function exportAssetsAction(filters: AssetFiltersInput): Promise<string> {
  const session = await requireSession();
  requirePermission(session.role, "asset.export");

  const { rows } = await listAssets(session.workspaceId, { ...filters, pageSize: 500 });
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    select: { name: true },
  });

  const buffer = await exportAssetsXlsx(rows, workspace?.name ?? "Evam");
  return buffer.toString("base64");
}

export async function redirectToNewAsset() {
  redirect("/assets/new");
}

export async function bulkImportCsvAction(formData: FormData): Promise<ActionResult<CsvImportSummary>> {
  const session = await requireSession();
  requirePermission(session.role, "asset.import");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a CSV file to import." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "CSV must be under 5 MB." };
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);
  if (rows.length === 0) {
    return { ok: false, error: "CSV has no data rows." };
  }
  const requiredHeader = "name";
  if (!headers.includes(requiredHeader)) {
    return {
      ok: false,
      error: `CSV header must include "name". Got: ${headers.join(", ")}`,
    };
  }

  // Pre-fetch lookup maps once
  const [sites, categories, users] = await Promise.all([
    prisma.site.findMany({
      where: { workspaceId: session.workspaceId },
      select: { id: true, name: true, locations: { select: { id: true, name: true } } },
    }),
    prisma.category.findMany({
      where: { workspaceId: session.workspaceId },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { workspaceId: session.workspaceId, deletedAt: null },
      select: { id: true, email: true },
    }),
  ]);
  const siteByName = new Map(sites.map((s) => [s.name.toLowerCase(), s]));
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

  const errors: CsvImportSummary["errors"] = [];
  let imported = 0;
  const created: Array<{ id: string; tag: string; name: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i]!;
      const lineNo = i + 2; // header is row 1

      const parsed = csvImportRowSchema.safeParse({
        ...raw,
        purchasePrice: raw.purchasePrice ? Number(raw.purchasePrice) : undefined,
        memoryGB: raw.memoryGB ? Number(raw.memoryGB) : undefined,
        storageGB: raw.storageGB ? Number(raw.storageGB) : undefined,
        displayInches: raw.displayInches ? Number(raw.displayInches) : undefined,
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        errors.push({
          row: lineNo,
          tag: raw.tag || undefined,
          reason: `${issue?.path?.join(".") ?? "field"}: ${issue?.message ?? "invalid"}`,
        });
        continue;
      }

      const row = parsed.data;
      const site = row.site ? siteByName.get(row.site.toLowerCase()) : undefined;
      const location =
        site && row.location
          ? site.locations.find((l) => l.name.toLowerCase() === row.location!.toLowerCase())
          : undefined;
      const category = row.category
        ? categoryByName.get(row.category.toLowerCase())
        : undefined;
      const assignee = row.assigneeEmail
        ? userByEmail.get(row.assigneeEmail.toLowerCase())
        : undefined;

      const tag = row.tag?.trim() || (await generateNextTag(session.workspaceId, tx));
      const conflict = await tx.asset.findFirst({
        where: { workspaceId: session.workspaceId, tag, deletedAt: null },
        select: { id: true },
      });
      if (conflict) {
        errors.push({ row: lineNo, tag, reason: `tag ${tag} already exists` });
        continue;
      }

      const purchaseDate = row.purchaseDate ? new Date(row.purchaseDate) : undefined;
      const warrantyEndsAt = row.warrantyEndsAt ? new Date(row.warrantyEndsAt) : undefined;

      try {
        const asset = await tx.asset.create({
          data: {
            workspaceId: session.workspaceId,
            tag,
            name: row.name,
            status: row.status ?? "AVAILABLE",
            currency: row.currency ?? "USD",
            ...clean({
              brand: row.brand,
              model: row.model,
              serialNumber: row.serialNumber,
              categoryId: category?.id,
              siteId: site?.id,
              locationId: location?.id,
              assigneeId: assignee?.id,
              purchaseDate,
              purchasePrice: row.purchasePrice,
              warrantyEndsAt,
              cpu: row.cpu,
              memoryGB: row.memoryGB,
              storageGB: row.storageGB,
              displayInches: row.displayInches,
              os: row.os,
              notes: row.notes,
            }),
          },
          select: { id: true, tag: true, name: true },
        });
        created.push(asset);
        imported += 1;
      } catch (err) {
        errors.push({
          row: lineNo,
          tag,
          reason: err instanceof Error ? err.message : "insert failed",
        });
      }
    }

    if (created.length > 0) {
      await tx.auditLog.createMany({
        data: created.map((a) => ({
          workspaceId: session.workspaceId,
          actorId: session.userId,
          action: "asset.imported",
          resourceType: "asset",
          resourceId: a.id,
          payload: { tag: a.tag, name: a.name, source: "csv" },
        })),
      });
    }
  });

  revalidatePath("/assets");
  revalidatePath("/dashboard");

  return {
    ok: true,
    data: { total: rows.length, imported, failed: errors.length, errors },
  };
}

export async function getCsvTemplate(): Promise<string> {
  return CSV_TEMPLATE_HEADERS.join(",") + "\n";
}

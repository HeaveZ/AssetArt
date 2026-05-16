import { z } from "zod";

export const AssetStatusEnum = z.enum([
  "AVAILABLE",
  "CHECKED_OUT",
  "IN_MAINTENANCE",
  "RESERVED",
  "LEASED",
  "DISPOSED",
  "LOST",
]);
export type AssetStatusInput = z.infer<typeof AssetStatusEnum>;

export const assetBasicsSchema = z.object({
  tag: z.string().trim().max(20, "Max 20 chars").optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().trim().max(60).optional().or(z.literal("")),
  model: z.string().trim().max(80).optional().or(z.literal("")),
  serialNumber: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
});

export const assetSpecsSchema = z.object({
  cpu: z.string().trim().max(80).optional().or(z.literal("")),
  memoryGB: z.coerce.number().int().min(0).max(2048).optional(),
  storageGB: z.coerce.number().int().min(0).max(100000).optional(),
  displayInches: z.coerce.number().min(0).max(120).optional(),
  os: z.string().trim().max(60).optional().or(z.literal("")),
});

export const assetAssignmentSchema = z.object({
  status: AssetStatusEnum.default("AVAILABLE"),
  siteId: z.string().optional().or(z.literal("")),
  locationId: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().min(0).max(1_000_000_000).optional(),
  currency: z.string().length(3).default("USD"),
  warrantyEndsAt: z.coerce.date().optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export const createAssetSchema = assetBasicsSchema
  .extend(assetSpecsSchema.shape)
  .extend(assetAssignmentSchema.shape);

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = createAssetSchema.partial();
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

/* ───────── AI auto-categorize ───────── */

export const aiCategorizeInputSchema = z.object({
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  serialNumber: z.string().trim().max(80).optional(),
  name: z.string().trim().max(120).optional(),
});
export type AiCategorizeInput = z.infer<typeof aiCategorizeInputSchema>;

export const aiCategorizeResultSchema = z.object({
  categoryName: z.string().optional(),
  os: z.string().optional(),
  cpu: z.string().optional(),
  memoryGB: z.number().int().min(0).max(2048).optional(),
  storageGB: z.number().int().min(0).max(100000).optional(),
  displayInches: z.number().min(0).max(120).optional(),
  estimatedPriceUsd: z.number().min(0).max(1_000_000).optional(),
  estimatedWarrantyYears: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type AiCategorizeResult = z.infer<typeof aiCategorizeResultSchema>;

/* ───────── CSV bulk import ───────── */

export const csvImportRowSchema = z.object({
  tag: z.string().trim().max(20).optional(),
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  serialNumber: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  site: z.string().trim().max(60).optional(),
  location: z.string().trim().max(60).optional(),
  assigneeEmail: z.string().trim().email().optional().or(z.literal("")),
  status: AssetStatusEnum.optional(),
  purchaseDate: z.string().trim().optional(),
  purchasePrice: z.coerce.number().min(0).max(1_000_000_000).optional(),
  currency: z.string().length(3).optional(),
  memoryGB: z.coerce.number().int().min(0).max(2048).optional(),
  storageGB: z.coerce.number().int().min(0).max(100000).optional(),
  os: z.string().trim().max(60).optional(),
  cpu: z.string().trim().max(80).optional(),
  displayInches: z.coerce.number().min(0).max(120).optional(),
  warrantyEndsAt: z.string().trim().optional(),
  notes: z.string().max(4000).optional(),
});
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;

export const CSV_TEMPLATE_HEADERS = [
  "tag", "name", "brand", "model", "serialNumber",
  "category", "site", "location", "assigneeEmail",
  "status", "purchaseDate", "purchasePrice", "currency",
  "memoryGB", "storageGB", "os", "cpu", "displayInches",
  "warrantyEndsAt", "notes",
] as const;

export const assetFiltersSchema = z.object({
  q: z.string().trim().optional(),
  status: z.array(AssetStatusEnum).optional(),
  siteId: z.array(z.string()).optional(),
  categoryId: z.array(z.string()).optional(),
  assigneeId: z.array(z.string()).optional(),
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  serial: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(500).default(50),
  sort: z.enum(["createdAt", "tag", "name", "purchasePrice", "warrantyEndsAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type AssetFiltersInput = z.infer<typeof assetFiltersSchema>;

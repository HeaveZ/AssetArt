import { z } from "zod";

export const MaintenanceTypeEnum = z.enum(["PREVENTIVE", "CORRECTIVE", "INSPECTION", "CALIBRATION"]);
export type MaintenanceTypeInput = z.infer<typeof MaintenanceTypeEnum>;

export const MaintenanceStatusEnum = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "OVERDUE",
]);
export type MaintenanceStatusInput = z.infer<typeof MaintenanceStatusEnum>;

export const createMaintenanceSchema = z.object({
  assetId: z.string().min(1, "Pick an asset"),
  type: MaintenanceTypeEnum,
  scheduledAt: z.coerce.date().optional(),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  cost: z.coerce.number().min(0).max(1_000_000_000).optional(),
  currency: z.string().length(3).default("USD").optional(),
});
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const completeMaintenanceSchema = z.object({
  id: z.string().min(1),
  cost: z.coerce.number().min(0).max(1_000_000_000).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;

export const maintenanceFiltersSchema = z.object({
  status: z.array(MaintenanceStatusEnum).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type MaintenanceFiltersInput = z.infer<typeof maintenanceFiltersSchema>;

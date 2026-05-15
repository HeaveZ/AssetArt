import { z } from "zod";

export const AlertTypeEnum = z.enum([
  "WARRANTY_EXPIRING",
  "LEASE_EXPIRING",
  "MAINTENANCE_DUE",
  "LICENSE_EXPIRING",
  "ASSET_OVERDUE",
  "ASSET_MISSING",
]);
export type AlertTypeInput = z.infer<typeof AlertTypeEnum>;

export const AlertSeverityEnum = z.enum(["INFO", "WARNING", "CRITICAL"]);
export type AlertSeverityInput = z.infer<typeof AlertSeverityEnum>;

export const AlertReadStateEnum = z.enum(["ALL", "UNREAD", "READ"]);
export type AlertReadState = z.infer<typeof AlertReadStateEnum>;

export const alertFiltersSchema = z.object({
  type: z.array(AlertTypeEnum).optional(),
  severity: z.array(AlertSeverityEnum).optional(),
  read: AlertReadStateEnum.default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type AlertFiltersInput = z.infer<typeof alertFiltersSchema>;

import { z } from "zod";

export const LeaseStatusEnum = z.enum(["ACTIVE", "EXPIRING", "ENDED", "CANCELLED"]);
export type LeaseStatusInput = z.infer<typeof LeaseStatusEnum>;

export const LeaseSegmentEnum = z.enum(["ACTIVE", "EXPIRING", "ENDED"]);
export type LeaseSegment = z.infer<typeof LeaseSegmentEnum>;

export const createLeaseSchema = z
  .object({
    assetId: z.string().min(1, "Pick an asset"),
    vendor: z.string().trim().min(1, "Vendor is required").max(120),
    contractRef: z.string().trim().max(120).optional().or(z.literal("")),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    monthlyCost: z.coerce.number().min(0).max(1_000_000_000),
    currency: z.string().length(3).default("USD"),
    autoRenew: z.coerce.boolean().default(false),
    notes: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine((v) => v.endDate.getTime() > v.startDate.getTime(), {
    message: "End date must be after start date",
    path: ["endDate"],
  });
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;

export const cancelLeaseSchema = z.object({ id: z.string().min(1) });

import { z } from "zod";

export const CheckoutTargetEnum = z.enum(["USER", "PERSON", "SITE", "CUSTOMER"]);
export type CheckoutTargetInput = z.infer<typeof CheckoutTargetEnum>;

export const checkoutInputSchema = z
  .object({
    assetIds: z.array(z.string().min(1)).min(1, "Pick at least one asset").max(50, "Max 50 assets per checkout"),
    target: CheckoutTargetEnum,
    targetId: z.string().min(1, "Pick a target"),
    dueAt: z.coerce.date().optional(),
    notes: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine((v) => !v.dueAt || v.dueAt.getTime() > Date.now() - 86_400_000, {
    message: "Due date can't be in the past",
    path: ["dueAt"],
  });

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export const checkinInputSchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1, "Pick at least one asset").max(100),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type CheckinInput = z.infer<typeof checkinInputSchema>;

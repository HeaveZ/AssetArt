"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Form } from "@/frontend/components/ui/form";
import { Button } from "@/frontend/components/ui/button";
import {
  AssetFormStepper,
  type StepDef,
} from "@/frontend/components/features/assets/asset-form-stepper";
import { StepBasics } from "@/frontend/components/features/assets/asset-form-step-basics";
import { StepSpecs } from "@/frontend/components/features/assets/asset-form-step-specs";
import { StepAssignment } from "@/frontend/components/features/assets/asset-form-step-assignment";
import { StepPhotos } from "@/frontend/components/features/assets/asset-form-step-photos";
import { StepReview } from "@/frontend/components/features/assets/asset-form-step-review";
import {
  createAssetAction,
  updateAssetAction,
} from "@/backend/actions/assets";
import {
  createAssetSchema,
  type CreateAssetInput,
} from "@/shared/schemas/asset";

const STEPS: StepDef[] = [
  { id: "basics",     label: "Basics",     description: "Identity & category" },
  { id: "specs",      label: "Specs",      description: "Hardware details" },
  { id: "assignment", label: "Assignment", description: "Status, site, owner" },
  { id: "photos",     label: "Photos",     description: "Visual record" },
  { id: "review",     label: "Review",     description: "Final check" },
];

const STEP_FIELDS: Record<number, FieldPath<CreateAssetInput>[]> = {
  0: ["tag", "name", "brand", "model", "serialNumber", "categoryId", "description"],
  1: ["cpu", "memoryGB", "storageGB", "displayInches", "os"],
  2: [
    "status",
    "siteId",
    "locationId",
    "assigneeId",
    "purchaseDate",
    "purchasePrice",
    "currency",
    "warrantyEndsAt",
    "notes",
  ],
  3: [],
  4: [],
};

export interface AssetFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<CreateAssetInput>;
  assetId?: string;
  categories: { id: string; name: string }[];
  sites: { id: string; name: string }[];
  locations: { id: string; name: string; siteId: string }[];
  assignees: { id: string; name: string | null; email: string }[];
}

const DEFAULTS: CreateAssetInput = {
  tag: "",
  name: "",
  brand: "",
  model: "",
  serialNumber: "",
  description: "",
  categoryId: "",
  cpu: "",
  memoryGB: undefined,
  storageGB: undefined,
  displayInches: undefined,
  os: "",
  status: "AVAILABLE",
  siteId: "",
  locationId: "",
  assigneeId: "",
  purchaseDate: undefined,
  purchasePrice: undefined,
  currency: "USD",
  warrantyEndsAt: undefined,
  notes: "",
};

export function AssetForm({
  mode,
  initialValues,
  assetId,
  categories,
  sites,
  locations,
  assignees,
}: AssetFormProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [submitting, startTransition] = useTransition();
  const [direction, setDirection] = useState<1 | -1>(1);

  const defaultValues = useMemo<CreateAssetInput>(
    () => ({ ...DEFAULTS, ...(initialValues ?? {}) }),
    [initialValues],
  );

  const form = useForm<CreateAssetInput>({
    // The schema's `.default()` calls make zod's input vs output types diverge.
    // We use the output type everywhere because our defaults satisfy it.
    resolver: zodResolver(createAssetSchema) as unknown as Resolver<CreateAssetInput>,
    defaultValues,
    mode: "onTouched",
  });

  async function gotoStep(target: number) {
    if (target === stepIndex) return;

    if (target > stepIndex) {
      // Forward — validate the current step's fields
      const fields = STEP_FIELDS[stepIndex] ?? [];
      const valid = fields.length === 0 ? true : await form.trigger(fields);
      if (!valid) {
        const firstError = Object.keys(form.formState.errors)[0];
        toast.error("Fix the highlighted fields", {
          description: firstError ? `Field: ${firstError}` : undefined,
        });
        return;
      }
      setCompleted((s) => new Set(s).add(stepIndex));
    }

    setDirection(target > stepIndex ? 1 : -1);
    setStepIndex(target);
  }

  function onSubmit(values: CreateAssetInput) {
    startTransition(async () => {
      if (mode === "create") {
        const result = await createAssetAction(null, values);
        if (!result.ok) {
          toast.error("Could not create asset", { description: result.error });
          return;
        }
        toast.success(`Asset ${result.data.tag} created`, {
          description: "Audit log + dashboard updated.",
        });
        router.push(`/assets/${result.data.id}`);
        router.refresh();
      } else if (mode === "edit" && assetId) {
        const result = await updateAssetAction(assetId, values);
        if (!result.ok) {
          toast.error("Could not save changes", { description: result.error });
          return;
        }
        toast.success("Changes saved");
        router.push(`/assets/${assetId}`);
        router.refresh();
      }
    });
  }

  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        // Prevent enter-key submit from triggering on intermediate steps
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isLast && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
            void gotoStep(stepIndex + 1);
          }
        }}
      >
        <AssetFormStepper
          steps={STEPS}
          current={stepIndex}
          completed={completed}
          onJump={gotoStep}
        />

        <div className="bg-surface relative overflow-hidden rounded-xl border p-5 sm:p-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 12 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            >
              {stepIndex === 0 && <StepBasics categories={categories} />}
              {stepIndex === 1 && <StepSpecs />}
              {stepIndex === 2 && (
                <StepAssignment sites={sites} locations={locations} assignees={assignees} />
              )}
              {stepIndex === 3 && <StepPhotos />}
              {stepIndex === 4 && (
                <StepReview
                  categories={categories}
                  sites={sites}
                  locations={locations}
                  assignees={assignees}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-3 z-10">
          <div className="bg-surface flex items-center justify-between gap-3 rounded-xl border p-3 shadow-pop">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => gotoStep(stepIndex - 1)}
              disabled={isFirst || submitting}
            >
              <ArrowLeft />
              Back
            </Button>

            <div className="text-text-muted hidden text-[11.5px] sm:block">
              Step <span className="text-text font-medium">{stepIndex + 1}</span> of{" "}
              <span className="text-text font-medium">{STEPS.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="secondary" size="md" disabled={submitting}>
                <Link href={mode === "edit" && assetId ? `/assets/${assetId}` : "/assets"}>
                  <X />
                  Cancel
                </Link>
              </Button>
              {isLast ? (
                <Button type="submit" variant="primary" size="md" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : <Save />}
                  {mode === "create" ? "Create asset" : "Save changes"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => gotoStep(stepIndex + 1)}
                >
                  Next
                  <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

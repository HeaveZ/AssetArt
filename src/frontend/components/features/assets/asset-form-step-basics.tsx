"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { aiCategorizeAction } from "@/backend/actions/ai-categorize";
import type { AiCategorizeResult, CreateAssetInput } from "@/shared/schemas/asset";

interface Props {
  categories: { id: string; name: string }[];
}

export function StepBasics({ categories }: Props) {
  const form = useFormContext<CreateAssetInput>();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiCategorizeResult | null>(null);

  async function autoFill() {
    const { brand, model, serialNumber, name } = form.getValues();
    if (!brand && !model && !serialNumber && !name) {
      toast.info("Add a brand, model, or serial first", {
        description: "AI needs at least one identifier.",
      });
      return;
    }
    setAiLoading(true);
    try {
      const result = await aiCategorizeAction({ brand, model, serialNumber, name });
      if (!result.ok) {
        toast.error("AI suggestion failed", { description: result.error });
        return;
      }
      setAiResult(result.data);
      applyAiResult(result.data);
      toast.success("Suggestions applied", {
        description: `${Math.round((result.data.confidence ?? 0) * 100)}% confidence`,
      });
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiResult(result: AiCategorizeResult) {
    if (result.categoryName) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === result.categoryName!.toLowerCase(),
      );
      if (match) form.setValue("categoryId", match.id, { shouldDirty: true });
    }
    if (result.os) form.setValue("os", result.os, { shouldDirty: true });
    if (result.cpu) form.setValue("cpu", result.cpu, { shouldDirty: true });
    if (typeof result.memoryGB === "number")
      form.setValue("memoryGB", result.memoryGB, { shouldDirty: true });
    if (typeof result.storageGB === "number")
      form.setValue("storageGB", result.storageGB, { shouldDirty: true });
    if (typeof result.displayInches === "number")
      form.setValue("displayInches", result.displayInches, { shouldDirty: true });
    if (typeof result.estimatedPriceUsd === "number") {
      form.setValue("purchasePrice", result.estimatedPriceUsd, { shouldDirty: true });
      form.setValue("currency", "USD", { shouldDirty: true });
    }
    if (typeof result.estimatedWarrantyYears === "number") {
      const date = new Date();
      date.setFullYear(date.getFullYear() + result.estimatedWarrantyYears);
      form.setValue("warrantyEndsAt", date, { shouldDirty: true });
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-text text-[16px] font-medium tracking-tight">Basics</h2>
          <p className="text-text-muted text-[12.5px]">
            What is this thing? Add a name and identifiers — we&apos;ll auto-tag if you leave it blank.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={autoFill}
          disabled={aiLoading}
          className="shrink-0"
        >
          {aiLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
          Auto-fill from serial
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset tag</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Auto-generate (E0001)"
                  className="font-mono uppercase"
                />
              </FormControl>
              <FormDescription>Leave empty to auto-assign the next available.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Apple MacBook Pro 16" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Apple, Dell, Lenovo…" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="MacBook Pro 16 M3" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial number</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="C02XXXXXXXX" className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              value={field.value || ""}
              onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="Any context other people need to know about this asset…"
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {aiResult ? (
        <div className="bg-info-bg/40 border-info-fg/20 rounded-lg border p-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="text-info-fg mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-info-fg text-[12.5px] font-medium">AI applied suggestions</p>
              <p className="text-text-muted mt-0.5 text-[11.5px] leading-relaxed">
                Specs, OS, warranty, and approximate price were populated from{" "}
                {[form.getValues("brand"), form.getValues("model")].filter(Boolean).join(" ")}
                . Review them on the next step.
              </p>
              {typeof aiResult.confidence === "number" ? (
                <Badge tone="info" size="sm" className="mt-1.5">
                  {Math.round(aiResult.confidence * 100)}% confidence
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

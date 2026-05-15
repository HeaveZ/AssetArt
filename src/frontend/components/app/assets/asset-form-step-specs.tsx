"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import type { CreateAssetInput } from "@/shared/schemas/asset";

export function StepSpecs() {
  const form = useFormContext<CreateAssetInput>();
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-text text-[16px] font-medium tracking-tight">Specs</h2>
        <p className="text-text-muted text-[12.5px]">
          Technical specs make filtering, depreciation, and reports more useful. All optional.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="cpu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPU</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="M3 Pro, Intel i7-13700H…" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="os"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operating system</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="macOS 14, Windows 11 Pro…" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="memoryGB"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Memory (GB)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={2048}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="storageGB"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage (GB)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100000}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>Use GB — e.g. 1024 for 1 TB.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayInches"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display (inches)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={120}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

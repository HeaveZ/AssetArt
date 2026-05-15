"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

export type StepDef = {
  id: string;
  label: string;
  description: string;
};

interface Props {
  steps: StepDef[];
  current: number;
  completed: Set<number>;
  onJump?: (index: number) => void;
}

export function AssetFormStepper({ steps, current, completed, onJump }: Props) {
  return (
    <nav aria-label="Steps" className="bg-surface rounded-xl border p-4">
      <ol className="flex items-center gap-2">
        {steps.map((step, i) => {
          const isActive = i === current;
          const isDone = completed.has(i) && !isActive;
          const isClickable = onJump && (isDone || i < current);
          return (
            <li key={step.id} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onJump?.(i)}
                className={cn(
                  "flex flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
                  "transition-colors duration-150",
                  isClickable && "hover:bg-surface-muted cursor-pointer",
                  !isClickable && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-medium",
                    "transition-colors duration-200",
                    isActive && "border-brand-orange-500 bg-brand-orange-500 text-white",
                    isDone && "border-success-fg bg-success-fg text-white",
                    !isActive && !isDone && "border-border bg-surface text-text-subtle",
                  )}
                >
                  {isDone ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                  {isActive ? (
                    <motion.span
                      layoutId="step-ring"
                      className="absolute -inset-1 rounded-full border-2 border-brand-orange-500/30"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  ) : null}
                </span>
                <span className="hidden min-w-0 flex-1 sm:block">
                  <span
                    className={cn(
                      "block truncate text-[12.5px] font-medium",
                      isActive ? "text-text" : "text-text-muted",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-text-subtle block truncate text-[11px]">
                    {step.description}
                  </span>
                </span>
              </button>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1 h-px flex-1 transition-colors",
                    isDone || (isActive && completed.has(i - 1)) ? "bg-success-fg/30" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

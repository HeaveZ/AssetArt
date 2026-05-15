"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/frontend/lib/utils";

const Tabs = TabsPrimitive.Root;

type ListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;
type ListRef = React.ComponentRef<typeof TabsPrimitive.List>;
type TriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;
type TriggerRef = React.ComponentRef<typeof TabsPrimitive.Trigger>;

function styledList(displayName: string, classes: string) {
  const Cmp = React.forwardRef<ListRef, ListProps>(({ className, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn(classes, className)} {...props} />
  ));
  Cmp.displayName = displayName;
  return Cmp;
}

function styledTrigger(displayName: string, classes: string) {
  const Cmp = React.forwardRef<TriggerRef, TriggerProps>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger ref={ref} className={cn(classes, className)} {...props} />
  ));
  Cmp.displayName = displayName;
  return Cmp;
}

const TabsList = styledList(
  TabsPrimitive.List.displayName ?? "TabsList",
  "relative inline-flex items-center gap-1 border-b border-border",
);

const TabsTrigger = styledTrigger(
  TabsPrimitive.Trigger.displayName ?? "TabsTrigger",
  cn(
    "relative inline-flex items-center gap-1.5 px-3 py-2 -mb-px",
    "text-[12.5px] font-medium text-text-muted",
    "border-b-2 border-transparent",
    "transition-colors duration-150 ease-out",
    "hover:text-text",
    "data-[state=active]:text-text data-[state=active]:border-brand-orange-500",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 focus-visible:rounded-sm",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:h-3.5 [&_svg]:w-3.5",
  ),
);

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 outline-none animate-fade-in-up",
      "focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 focus-visible:rounded-md",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

/** Pill-style segmented control (alt design) */
const TabsListSegmented = styledList(
  "TabsListSegmented",
  "inline-flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5 border border-border-subtle",
);

const TabsTriggerSegmented = styledTrigger(
  "TabsTriggerSegmented",
  cn(
    "px-3 h-7 rounded-md text-[12px] font-medium text-text-muted",
    "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    "data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-soft",
    "hover:text-text",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40",
  ),
);

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsListSegmented, TabsTriggerSegmented };

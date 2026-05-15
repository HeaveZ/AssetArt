import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/frontend/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium",
    "rounded-md select-none",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-b from-brand-orange-500 to-brand-orange-600",
          "text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(178,86,12,0.35)]",
          "hover:from-brand-orange-400 hover:to-brand-orange-500",
          "active:from-brand-orange-600 active:to-brand-orange-700",
        ].join(" "),
        secondary: [
          "bg-surface text-text border border-border",
          "hover:bg-surface-muted hover:border-border-strong",
          "active:bg-surface-subtle",
          "dark:bg-surface-elevated",
        ].join(" "),
        ghost: [
          "bg-transparent text-text-muted",
          "hover:bg-surface-muted hover:text-text",
        ].join(" "),
        outline: [
          "bg-transparent text-text border border-border",
          "hover:bg-surface-muted",
        ].join(" "),
        destructive: [
          "bg-danger-bg text-danger-fg border border-danger-fg/20",
          "hover:bg-danger-fg hover:text-white",
        ].join(" "),
        link: [
          "bg-transparent text-info-fg underline-offset-4 hover:underline p-0 h-auto",
        ].join(" "),
        navy: [
          "bg-brand-navy-900 text-white",
          "hover:bg-brand-navy-800 active:bg-brand-navy-950",
        ].join(" "),
      },
      size: {
        xs: "h-7 px-2 text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5",
        sm: "h-8 px-3 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5",
        md: "h-9 px-3.5 text-[13px] [&_svg]:h-4 [&_svg]:w-4",
        lg: "h-10 px-4 text-[14px] [&_svg]:h-4 [&_svg]:w-4",
        icon: "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4",
        "icon-sm": "h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

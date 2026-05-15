import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-9 w-full rounded-md border bg-surface px-3 py-1.5",
          "text-[13px] text-text placeholder:text-text-subtle",
          "border-border",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 focus-visible:border-brand-orange-500/60",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
          "file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-text",
          "aria-[invalid=true]:border-danger-fg/60 aria-[invalid=true]:focus-visible:ring-danger-fg/30",
          "dark:bg-surface-elevated",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

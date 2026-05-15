import * as React from "react";
import { cn } from "@/frontend/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex min-h-[88px] w-full rounded-md border bg-surface px-3 py-2",
          "text-[13px] text-text placeholder:text-text-subtle",
          "border-border resize-none",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 focus-visible:border-brand-orange-500/60",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
          "aria-[invalid=true]:border-danger-fg/60",
          "dark:bg-surface-elevated",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };

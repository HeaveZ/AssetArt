"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      duration={4000}
      richColors={false}
      closeButton={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-text group-[.toaster]:border-border group-[.toaster]:shadow-pop group-[.toaster]:rounded-lg group-[.toaster]:text-[13px]",
          description: "group-[.toast]:text-text-muted",
          actionButton:
            "group-[.toast]:bg-brand-orange-500 group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:text-[12px] group-[.toast]:px-2 group-[.toast]:h-7",
          cancelButton:
            "group-[.toast]:bg-surface-muted group-[.toast]:text-text-muted group-[.toast]:rounded-md group-[.toast]:text-[12px] group-[.toast]:px-2 group-[.toast]:h-7",
        },
      }}
      {...props}
    />
  );
}

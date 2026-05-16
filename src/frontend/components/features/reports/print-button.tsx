"use client";

import { Printer } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button variant="primary" size="sm" onClick={() => window.print()}>
      <Printer /> {label}
    </Button>
  );
}

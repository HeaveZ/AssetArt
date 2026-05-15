import type { Metadata } from "next";
import { ArrowUpFromLine } from "lucide-react";
import { PageHeader } from "@/frontend/components/app/page-header";
import { EmptyState } from "@/frontend/components/app/empty-state";

export const metadata: Metadata = { title: "Check out" };

export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Check out" description="Hand off assets to people, customers, or sites." />
      <EmptyState
        icon={ArrowUpFromLine}
        title="Check-out flow arrives in milestone 5"
        description="Two-pane picker (assets ↔ target), due dates, notes, bulk."
      />
    </div>
  );
}

import type { Metadata } from "next";
import { ArrowDownToLine } from "lucide-react";
import { PageHeader } from "@/frontend/components/app/page-header";
import { EmptyState } from "@/frontend/components/app/empty-state";

export const metadata: Metadata = { title: "Check in" };

export default function CheckinPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Check in" description="Return assets and update their status." />
      <EmptyState
        icon={ArrowDownToLine}
        title="Check-in flow arrives in milestone 5"
        description="Bulk return, condition notes, audit log entry."
      />
    </div>
  );
}

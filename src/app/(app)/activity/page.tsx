import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { PageHeader } from "@/frontend/components/app/page-header";
import { EmptyState } from "@/frontend/components/app/empty-state";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="A full audit log of every move, swap, and signature."
      />
      <EmptyState
        icon={Activity}
        title="Audit log arrives in milestone 8"
        description="Filter by actor, action, resource, and date range. Pagination."
      />
    </div>
  );
}

import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/frontend/components/app/page-header";
import { EmptyState } from "@/frontend/components/app/empty-state";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Warranty, lease, license, and maintenance deadlines — sorted by severity."
      />
      <EmptyState
        icon={AlertTriangle}
        title="Alerts inbox arrives in milestone 8"
        description="Type / severity filters, mark read, bulk dismiss, top-bar bell with unread count."
      />
    </div>
  );
}

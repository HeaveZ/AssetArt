import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Maintenance" };

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Schedule, track, and complete maintenance jobs." />
      <EmptyState icon={Wrench} title="Maintenance arrives in milestone 6" description="Schedule filter chips, complete action, daily overdue computation." />
    </div>
  );
}

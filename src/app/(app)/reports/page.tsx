import type { Metadata } from "next";
import { FileChartColumn } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Asset register, depreciation, utilization, lease forecast, warranty calendar." />
      <EmptyState icon={FileChartColumn} title="Reports arrive in milestone 10" description="Seven reports with table + chart + Excel + PDF exports." />
    </div>
  );
}

import type { Metadata } from "next";
import { ChartLine } from "lucide-react";
import { PageHeader } from "@/frontend/components/common/page-header";
import { EmptyState } from "@/frontend/components/common/empty-state";

export const metadata: Metadata = { title: "Forecast" };

export default function ForecastPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Forecast" description="Projected refresh schedule, depreciation curves, and lease pipeline." />
      <EmptyState icon={ChartLine} title="Forecasting arrives in milestone 10" description="ML-assisted refresh predictions based on asset age + maintenance history." />
    </div>
  );
}

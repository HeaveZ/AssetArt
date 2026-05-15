import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Leases" };

export default function LeasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leases" description="Active leases, upcoming renewals, and cost forecasts." />
      <EmptyState icon={ReceiptText} title="Leases arrive in milestone 7" description="Active / expiring (60-day) / ended segments. Auto-generated lease-expiring alerts." />
    </div>
  );
}

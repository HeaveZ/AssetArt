import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Licenses" };

export default function LicensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Licenses" description="Software seats, expiry dates, and seat utilization." />
      <EmptyState icon={KeyRound} title="License manager arrives in milestone 7" description="Seat tracking, expiry alerts, seat utilization charts." />
    </div>
  );
}

import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/frontend/components/app/page-header";
import { EmptyState } from "@/frontend/components/app/empty-state";

export const metadata: Metadata = { title: "Transfer" };

export default function TransferPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Transfer" description="Move assets between sites, locations, or assignees." />
      <EmptyState icon={ArrowLeftRight} title="Transfer flow arrives in milestone 5" description="Multi-asset transfer with destination picker and reason notes." />
    </div>
  );
}

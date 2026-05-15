import type { Metadata } from "next";
import { PackageX } from "lucide-react";
import { PageHeader } from "@/frontend/components/common/page-header";
import { EmptyState } from "@/frontend/components/common/empty-state";

export const metadata: Metadata = { title: "Disposed" };

export default function DisposedPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Disposed" description="Archived assets that have left service." />
      <EmptyState icon={PackageX} title="Disposed archive arrives in milestone 4" description="Restore, permanent delete, audit retention." />
    </div>
  );
}

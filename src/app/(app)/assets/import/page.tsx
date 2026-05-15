import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/frontend/components/app/page-header";
import { Button } from "@/frontend/components/ui/button";
import { AssetCsvImport } from "@/frontend/components/app/assets/asset-csv-import";
import { can } from "@/shared/permissions";

export const metadata: Metadata = { title: "Bulk import" };

export default async function ImportAssetsPage() {
  const session = await auth();
  if (!session?.user) notFound();
  if (!can(session.user.role, "asset.import")) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Bulk import"
        description="Pour in a spreadsheet and we'll convert it into proper asset records."
        actions={
          <>
            <Button asChild variant="ghost" size="md">
              <Link href="/assets">
                <ArrowLeft />
                Back to assets
              </Link>
            </Button>
            <Button asChild variant="primary" size="md">
              <Link href="/assets/new">
                <Plus />
                Single asset
              </Link>
            </Button>
          </>
        }
      />

      <AssetCsvImport />
    </div>
  );
}

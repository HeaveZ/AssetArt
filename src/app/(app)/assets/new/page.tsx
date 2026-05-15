import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileUp, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/frontend/components/common/page-header";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { AssetForm } from "@/frontend/components/features/assets/asset-form";
import { getAssetFormData } from "@/backend/services/assets";
import { can } from "@/shared/permissions";

export const metadata: Metadata = { title: "New asset" };

export default async function NewAssetPage() {
  const session = await auth();
  if (!session?.user) notFound();
  if (!can(session.user.role, "asset.create")) notFound();

  const formData = await getAssetFormData(session.user.workspaceId);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="New asset"
        description="Tag, describe, and place the device. The AI can fill in the boring bits."
        meta={
          <div className="flex items-center gap-2">
            <Badge tone="orange" size="md">
              <Sparkles className="h-3 w-3" /> AI auto-fill available
            </Badge>
          </div>
        }
        actions={
          <>
            <Button asChild variant="ghost" size="md">
              <Link href="/assets">
                <ArrowLeft />
                Back
              </Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/assets/import">
                <FileUp />
                Bulk CSV
              </Link>
            </Button>
          </>
        }
      />

      <AssetForm
        mode="create"
        categories={formData.categories}
        sites={formData.sites}
        locations={formData.locations}
        assignees={formData.assignees}
      />
    </div>
  );
}

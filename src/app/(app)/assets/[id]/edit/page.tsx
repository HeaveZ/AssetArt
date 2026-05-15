import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/frontend/components/app/page-header";
import { Button } from "@/frontend/components/ui/button";
import { AssetForm } from "@/frontend/components/app/assets/asset-form";
import { getAssetForEdit, getAssetFormData } from "@/backend/services/assets";
import { can } from "@/shared/permissions";
import type { CreateAssetInput } from "@/shared/schemas/asset";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Edit · ${id.slice(-6)}` };
}

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  if (!can(session.user.role, "asset.update")) notFound();

  const [asset, formData] = await Promise.all([
    getAssetForEdit(session.user.workspaceId, id),
    getAssetFormData(session.user.workspaceId),
  ]);
  if (!asset) notFound();

  const initialValues: Partial<CreateAssetInput> = {
    tag: asset.tag,
    name: asset.name,
    brand: asset.brand ?? "",
    model: asset.model ?? "",
    serialNumber: asset.serialNumber ?? "",
    description: asset.description ?? "",
    categoryId: asset.categoryId ?? "",
    cpu: asset.cpu ?? "",
    memoryGB: asset.memoryGB ?? undefined,
    storageGB: asset.storageGB ?? undefined,
    displayInches: asset.displayInches ? Number(asset.displayInches) : undefined,
    os: asset.os ?? "",
    status: asset.status,
    siteId: asset.siteId ?? "",
    locationId: asset.locationId ?? "",
    assigneeId: asset.assigneeId ?? "",
    purchaseDate: asset.purchaseDate ?? undefined,
    purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : undefined,
    currency: asset.currency,
    warrantyEndsAt: asset.warrantyEndsAt ?? undefined,
    notes: asset.notes ?? "",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={`Edit ${asset.tag}`}
        description={asset.name}
        actions={
          <Button asChild variant="ghost" size="md">
            <Link href={`/assets/${asset.id}`}>
              <ArrowLeft />
              Back to detail
            </Link>
          </Button>
        }
      />

      <AssetForm
        mode="edit"
        assetId={asset.id}
        initialValues={initialValues}
        categories={formData.categories}
        sites={formData.sites}
        locations={formData.locations}
        assignees={formData.assignees}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/frontend/components/common/page-header";
import { CheckoutWorkbench } from "@/frontend/components/features/checkouts/checkout-workbench";
import { getAvailableAssets, getCheckoutTargetOptions } from "@/backend/services/checkouts";
import { requireSession } from "@/backend/session";

export const metadata: Metadata = { title: "Check out" };

export default async function CheckoutPage() {
  const session = await requireSession();
  const [assets, targets] = await Promise.all([
    getAvailableAssets(session.workspaceId),
    getCheckoutTargetOptions(session.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check out"
        description="Hand off assets to people, customers, or sites. Multi-select supported."
      />
      <CheckoutWorkbench assets={assets} targets={targets} />
    </div>
  );
}

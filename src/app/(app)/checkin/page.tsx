import type { Metadata } from "next";
import { PageHeader } from "@/frontend/components/common/page-header";
import { CheckinWorkbench } from "@/frontend/components/features/checkouts/checkin-workbench";
import { getCheckedOutAssets } from "@/backend/services/checkouts";
import { requireSession } from "@/backend/session";

export const metadata: Metadata = { title: "Check in" };

export default async function CheckinPage() {
  const session = await requireSession();
  const assets = await getCheckedOutAssets(session.workspaceId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check in"
        description="Return assets to inventory. Status flips back to Available on submit."
      />
      <CheckinWorkbench assets={assets} />
    </div>
  );
}

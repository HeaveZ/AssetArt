import type { Metadata } from "next";
import { HelpShell } from "@/frontend/components/features/help/help-shell";
import { Badge } from "@/frontend/components/ui/badge";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <HelpShell
      title="Terms of service"
      description="The plain-language terms for using AssetArt. The legalese in your contract still wins where the two differ."
    >
      <Badge tone="muted" size="md">
        Last updated: May 16, 2026
      </Badge>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">1. Your account</h2>
      <p>
        You’re responsible for what happens under your account. Use a strong password, don’t share
        credentials, and let us know within 24 hours if something is off.
      </p>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">2. Your data</h2>
      <p>
        Asset records, photos, and audit logs belong to your workspace. We process them to run the
        product (database, search, alerts). We don’t sell them, ever. You can export everything as
        Excel or JSON at any time from Settings.
      </p>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">3. Acceptable use</h2>
      <ul className="list-disc space-y-1 pl-5 text-[13px]">
        <li>Don’t probe other workspaces or reverse-engineer the platform.</li>
        <li>Don’t upload illegal content or content you don’t have rights to.</li>
        <li>Don’t run automated load that materially impacts other tenants.</li>
      </ul>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">4. Billing</h2>
      <p>
        Paid plans renew automatically. Cancel any time from Settings → Subscription. Refunds are
        prorated to the day. No surprise invoices.
      </p>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">5. Uptime</h2>
      <p>
        Pro plans target 99.5% monthly uptime; Enterprise is 99.9% with credits. Maintenance
        windows are announced in advance on the changelog.
      </p>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">6. Changes</h2>
      <p>
        We may update these terms — when we do, we’ll email account owners and post a diff on this
        page. Continued use after a major change counts as acceptance.
      </p>

      <p className="text-text-muted mt-8 text-[12px]">
        Need the full legal version for procurement? Email{" "}
        <a className="text-info-fg underline-offset-2 hover:underline" href="mailto:legal@assetart.com">
          legal@assetart.com
        </a>
        .
      </p>
    </HelpShell>
  );
}

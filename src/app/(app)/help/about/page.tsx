import type { Metadata } from "next";
import { Boxes, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { HelpShell } from "@/frontend/components/features/help/help-shell";

export const metadata: Metadata = { title: "About AssetArt" };

export default function AboutPage() {
  return (
    <HelpShell
      title="About AssetArt"
      description="A modern, opinionated take on asset tracking. Built for IT teams who'd rather ship code than fight a spreadsheet."
    >
      <p>
        AssetArt is an open-design asset management platform — devices, leases, licenses, and
        everything in between. We obsess over the boring parts (serial numbers, warranty
        countdowns, checkout audit trails) so your portfolio stays trustworthy without anyone
        babysitting it.
      </p>

      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        <Pillar
          icon={Compass}
          title="Opinionated, not bloated"
          body="One way to do each thing — and the right way. No 50-tab settings panel."
        />
        <Pillar
          icon={Sparkles}
          title="Premium feel by default"
          body="Motion, hairlines, and tabular nums everywhere. Built on Next.js and Radix."
        />
        <Pillar
          icon={ShieldCheck}
          title="Security-first"
          body="Workspace isolation, audit trails, bcrypt-hashed credentials. SSO is on the roadmap."
        />
        <Pillar
          icon={Boxes}
          title="Composable taxonomy"
          body="Nested categories, custom fields per category, saved views per user."
        />
      </div>

      <h2 className="text-text mt-8 text-[16px] font-medium tracking-tight">What’s coming next</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[13px]">
        <li>Camera-based barcode scanning</li>
        <li>SAML SSO and SCIM provisioning</li>
        <li>Mobile-first responsive overhaul</li>
        <li>Automated maintenance scheduling with calendar integrations</li>
      </ul>

      <p className="text-text-muted mt-6 text-[12px]">
        Build crafted with care. Powered by Next.js 16, Prisma 7, and a lot of hairline borders.
      </p>
    </HelpShell>
  );
}

function Pillar({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface rounded-xl border p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-brand-orange-600 bg-brand-orange-100/60 dark:bg-brand-orange-500/15 dark:text-brand-orange-300 flex h-7 w-7 items-center justify-center rounded-md">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-text text-[13px] font-medium">{title}</h3>
      </div>
      <p className="text-text-muted text-[12px] leading-relaxed">{body}</p>
    </div>
  );
}

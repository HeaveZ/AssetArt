import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { HelpShell } from "@/frontend/components/features/help/help-shell";
import { Badge } from "@/frontend/components/ui/badge";

export const metadata: Metadata = { title: "Privacy policy" };

const COLLECT = [
  "Asset records (tags, names, specs, photos, locations) that you enter",
  "Account profile (name, email, avatar, last sign-in)",
  "Audit log of who did what, when",
  "Server logs (IP, user agent, request path) for 30 days for security",
];

const NEVER = [
  "We never sell or rent your data",
  "We never read your asset records or photos for analytics",
  "We never train AI models on your private data",
  "We never set advertising cookies",
];

export default function PrivacyPage() {
  return (
    <HelpShell
      title="Privacy policy"
      description="Short version: it’s your data. Here’s exactly what we do and don’t do with it."
    >
      <Badge tone="muted" size="md">
        Last updated: May 16, 2026
      </Badge>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">What we collect</h2>
      <ul className="not-prose mt-3 space-y-2">
        {COLLECT.map((item) => (
          <li key={item} className="text-text flex items-start gap-2 text-[13px]">
            <CheckCircle2 className="text-success-fg mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">What we never do</h2>
      <ul className="not-prose mt-3 space-y-2">
        {NEVER.map((item) => (
          <li key={item} className="text-text flex items-start gap-2 text-[13px]">
            <XCircle className="text-danger-fg mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">AI features</h2>
      <p>
        If you enable AI auto-categorize, asset metadata (brand, model, name, serial) is sent to
        Anthropic’s Claude API for inference. The Anthropic API does not retain inputs for training
        per their{" "}
        <a
          className="text-info-fg underline-offset-2 hover:underline"
          href="https://www.anthropic.com/legal"
          target="_blank"
          rel="noopener noreferrer"
        >
          terms
        </a>
        .
      </p>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">Your rights</h2>
      <ul className="list-disc space-y-1 pl-5 text-[13px]">
        <li>Export everything from Settings → Workspace → Export.</li>
        <li>Delete the workspace from Settings → Danger zone; we purge within 30 days.</li>
        <li>EU/UK residents: GDPR DSAR by email to privacy@assetart.com.</li>
      </ul>

      <p className="text-text-muted mt-8 text-[12px]">
        Questions? Email{" "}
        <a className="text-info-fg underline-offset-2 hover:underline" href="mailto:privacy@assetart.com">
          privacy@assetart.com
        </a>
        .
      </p>
    </HelpShell>
  );
}

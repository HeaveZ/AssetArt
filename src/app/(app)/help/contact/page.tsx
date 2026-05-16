import type { Metadata } from "next";
import { Bug, LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { HelpShell } from "@/frontend/components/features/help/help-shell";
import { ContactForm } from "@/frontend/components/features/help/contact-form";

export const metadata: Metadata = { title: "Contact us" };

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    detail: "support@assetart.com",
    description: "Best for non-urgent questions. We answer within 1 business day.",
    href: "mailto:support@assetart.com",
  },
  {
    icon: LifeBuoy,
    title: "Priority help",
    detail: "On Pro and Enterprise",
    description: "Faster SLAs, named contact, dedicated Slack channel.",
    href: "/settings/billing",
  },
  {
    icon: MessageSquare,
    title: "Community",
    detail: "GitHub Discussions",
    description: "Trade tips with other IT teams using AssetArt.",
    href: "https://github.com",
  },
  {
    icon: Bug,
    title: "Bug reports",
    detail: "GitHub Issues",
    description: "Open an issue with steps to reproduce — we triage daily.",
    href: "https://github.com",
  },
] as const;

export default function ContactPage() {
  return (
    <HelpShell
      title="Contact us"
      description="Pick the fastest channel for your need. The form below opens your email client with a pre-filled subject."
    >
      <div className="not-prose grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          const external = c.href.startsWith("http");
          return (
            <a
              key={c.title}
              href={c.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="card-lift bg-surface block rounded-xl border p-4 transition-colors"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="bg-surface-muted text-text-muted flex h-7 w-7 items-center justify-center rounded-md border">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-text text-[13px] font-medium">{c.title}</h3>
              </div>
              <p className="text-text text-[12.5px] font-medium">{c.detail}</p>
              <p className="text-text-muted mt-1 text-[12px] leading-relaxed">{c.description}</p>
            </a>
          );
        })}
      </div>

      <h2 className="text-text mt-8 text-[16px] font-medium tracking-tight">Drop us a note</h2>
      <p className="text-text-muted text-[13px]">
        This form launches your email client with everything filled in. Add details before
        sending.
      </p>
      <div className="not-prose mt-4">
        <ContactForm />
      </div>
    </HelpShell>
  );
}

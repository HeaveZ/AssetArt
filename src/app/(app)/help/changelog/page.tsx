import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { HelpShell } from "@/frontend/components/features/help/help-shell";
import { Badge } from "@/frontend/components/ui/badge";

export const metadata: Metadata = { title: "Changelog" };

type Tag = "Feature" | "Improvement" | "Fix" | "Design";
type BadgeTone = "info" | "success" | "warning" | "muted";
const TAG_TONE: Record<Tag, BadgeTone> = {
  Feature: "success",
  Improvement: "info",
  Fix: "warning",
  Design: "muted",
};

const ENTRIES: Array<{
  date: string;
  title: string;
  tag: Tag;
  bullets: string[];
}> = [
  {
    date: "May 16, 2026",
    title: "AssetArt platform expansion",
    tag: "Feature",
    bullets: [
      "Rich asset table with brand / model / serial / chip / memory / disk / OS columns",
      "Setup columns sheet with drag-to-reorder + per-user persistence",
      "Search criteria sheet with brand / model / serial text filters",
      "Top-right user menu with My profile / Change password / Account details / Subscription",
      "Help & Support hub with 8 sections including this changelog",
    ],
  },
  {
    date: "May 14, 2026",
    title: "Rebrand to AssetArt",
    tag: "Design",
    bullets: [
      "App rebranded from the legacy name to AssetArt",
      "Updated logo, palette tokens, and seed data",
    ],
  },
  {
    date: "May 12, 2026",
    title: "Floor map premium feature",
    tag: "Feature",
    bullets: [
      "Drag-to-pin assets onto floor plans",
      "Real-time hover and status pills",
      "Per-site floor plan management",
    ],
  },
  {
    date: "May 9, 2026",
    title: "Cmd+K polish + asset detail timeline",
    tag: "Improvement",
    bullets: [
      "Cmd+K palette: fuzzy match across pages, assets, and shortcuts",
      "Asset detail: photo carousel, timeline of audit + checkout + maintenance events",
      "QR sticker generator on every asset",
    ],
  },
  {
    date: "May 5, 2026",
    title: "Dashboard sparklines",
    tag: "Improvement",
    bullets: [
      "Inline 30-day sparklines on the four hero metric cards",
      "Status mix and category donut charts",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <HelpShell
      title="Changelog"
      description="Newest first. Subscribe to changelog@assetart.com to get release notes by email."
    >
      <div className="not-prose space-y-6">
        {ENTRIES.map((entry, i) => (
          <article
            key={entry.date}
            className="border-border-subtle relative border-l-2 pl-5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="bg-brand-orange-500 absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ring-2 ring-surface" />
            <header className="flex flex-wrap items-center gap-2">
              <Badge tone={TAG_TONE[entry.tag]} size="sm">
                {entry.tag === "Feature" ? <Sparkles className="h-3 w-3" /> : null}
                {entry.tag}
              </Badge>
              <h3 className="text-text text-[14px] font-medium tracking-tight">{entry.title}</h3>
              <span className="text-text-subtle text-[11px]">· {entry.date}</span>
            </header>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px]">
              {entry.bullets.map((b) => (
                <li key={b} className="text-text-muted">{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </HelpShell>
  );
}

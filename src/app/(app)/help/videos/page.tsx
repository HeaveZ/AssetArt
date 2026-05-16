import type { Metadata } from "next";
import { Clock, PlayCircle } from "lucide-react";
import { HelpShell } from "@/frontend/components/features/help/help-shell";
import { Badge } from "@/frontend/components/ui/badge";

export const metadata: Metadata = { title: "Videos" };

const VIDEOS = [
  { title: "Tour AssetArt in 90 seconds", duration: "1:30", tag: "Overview" },
  { title: "Adding assets — single, bulk, AI", duration: "4:20", tag: "Assets" },
  { title: "Check out and check in flows", duration: "3:10", tag: "Operations" },
  { title: "Floor maps and reservations", duration: "5:00", tag: "Premium" },
  { title: "Custom fields and saved views", duration: "3:45", tag: "Power user" },
  { title: "Reports and Excel exports", duration: "4:15", tag: "Reports" },
];

export default function VideosPage() {
  return (
    <HelpShell
      title="Walkthrough videos"
      description="We’re recording these as features ship. Drop us a note if there’s a workflow you want to see covered."
    >
      <ul className="not-prose grid gap-3 sm:grid-cols-2">
        {VIDEOS.map((v) => (
          <li
            key={v.title}
            className="bg-surface group/card relative overflow-hidden rounded-xl border"
          >
            <div className="from-brand-navy-700 to-brand-navy-900 relative flex aspect-video items-center justify-center bg-gradient-to-br">
              <PlayCircle className="text-white/70 group-hover/card:text-white h-12 w-12 transition-colors" />
              <Badge tone="muted" size="sm" className="absolute right-2 top-2">
                <Clock className="h-3 w-3" />
                {v.duration}
              </Badge>
              <span className="absolute bottom-2 left-2">
                <Badge tone="orange" size="sm">
                  Coming soon
                </Badge>
              </span>
            </div>
            <div className="p-3">
              <p className="text-text text-[12.5px] font-medium leading-snug">{v.title}</p>
              <p className="text-text-subtle mt-0.5 text-[11px]">{v.tag}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-text-muted mt-6 text-[12px]">
        Want one filmed first? Email it to{" "}
        <a className="text-info-fg underline-offset-2 hover:underline" href="mailto:support@assetart.com">
          support@assetart.com
        </a>{" "}
        with “video request” in the subject.
      </p>
    </HelpShell>
  );
}

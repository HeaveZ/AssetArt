import type { Metadata } from "next";
import { Keyboard } from "lucide-react";
import { HelpShell } from "@/frontend/components/features/help/help-shell";
import { Badge } from "@/frontend/components/ui/badge";

export const metadata: Metadata = { title: "Accessibility" };

const SHORTCUTS = [
  { key: "⌘ K", description: "Open command palette (search anywhere)" },
  { key: "G D", description: "Go to dashboard" },
  { key: "G A", description: "Go to assets" },
  { key: "G N", description: "Go to alerts" },
  { key: "G O", description: "Go to check-out" },
  { key: "G I", description: "Go to check-in" },
  { key: "G M", description: "Go to maintenance" },
  { key: "G L", description: "Go to leases" },
  { key: "G R", description: "Go to reports" },
  { key: "G S", description: "Go to settings" },
  { key: "Esc", description: "Close any dialog or panel" },
];

export default function AccessibilityPage() {
  return (
    <HelpShell
      title="Accessibility"
      description="We follow WCAG 2.1 AA and check every shipped page with axe. If something is keyboard-hostile, tell us."
    >
      <Badge tone="muted" size="md">
        WCAG 2.1 AA target
      </Badge>

      <h2 className="text-text mt-6 text-[16px] font-medium tracking-tight">What we commit to</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[13px]">
        <li>Full keyboard reachability — every action a mouse can do, a keyboard can too.</li>
        <li>Visible focus rings on every interactive element.</li>
        <li>Contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for UI elements.</li>
        <li>ARIA labels for all icon-only buttons and form controls.</li>
        <li>Respect <code className="bg-surface-muted border-border rounded border px-1 py-0.5 font-mono text-[11px]">prefers-reduced-motion</code> — we never disable critical UI on it, but animations dampen.</li>
        <li>No layout shift after font load — system fonts as fallback, fonts swap inline.</li>
      </ul>

      <h2 className="text-text mt-6 flex items-center gap-2 text-[16px] font-medium tracking-tight">
        <Keyboard className="h-4 w-4" />
        Keyboard shortcuts
      </h2>
      <p className="text-text-muted text-[12.5px]">
        Press a chord like <code className="bg-surface-muted border-border rounded border px-1 py-0.5 font-mono text-[10.5px]">G</code> then <code className="bg-surface-muted border-border rounded border px-1 py-0.5 font-mono text-[10.5px]">A</code> in quick succession.
      </p>
      <ul className="not-prose mt-3 divide-y rounded-xl border">
        {SHORTCUTS.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-text text-[12.5px]">{s.description}</span>
            <kbd className="bg-surface-muted border-border text-text inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10.5px]">
              {s.key}
            </kbd>
          </li>
        ))}
      </ul>

      <p className="text-text-muted mt-8 text-[12px]">
        Found a barrier?{" "}
        <a className="text-info-fg underline-offset-2 hover:underline" href="mailto:a11y@assetart.com">
          a11y@assetart.com
        </a>{" "}
        — we acknowledge within 48 hours and ship fixes in the next release.
      </p>
    </HelpShell>
  );
}

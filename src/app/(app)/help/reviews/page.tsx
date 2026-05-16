import type { Metadata } from "next";
import { Quote, Star } from "lucide-react";
import { HelpShell } from "@/frontend/components/features/help/help-shell";
import { Badge } from "@/frontend/components/ui/badge";

export const metadata: Metadata = { title: "User reviews" };

const REVIEWS = [
  {
    quote:
      "We replaced a spreadsheet that had survived three IT managers. The audit log alone is worth the move — we finally know who has what.",
    name: "Selin K.",
    title: "IT Operations Lead",
    company: "Mid-sized fintech",
    rating: 5,
  },
  {
    quote:
      "The CSV import handled 1,800 laptops without complaint. We were back to BAU the same afternoon.",
    name: "Marco D.",
    title: "Director of IT",
    company: "Industrial firm",
    rating: 5,
  },
  {
    quote:
      "I appreciate that it doesn't try to be a CMDB. It does asset tracking properly and stops there.",
    name: "Jonas P.",
    title: "Head of Workplace",
    company: "Consultancy",
    rating: 4,
  },
  {
    quote:
      "The floor map view is the only product I've seen that respects how big our open offices actually are.",
    name: "Priya S.",
    title: "Facilities Manager",
    company: "Tech scaleup",
    rating: 5,
  },
];

export default function ReviewsPage() {
  return (
    <HelpShell
      title="User reviews"
      description="Composite testimonials from beta workspaces. We don't pay for reviews and never edit critical feedback."
    >
      <div className="not-prose grid gap-3 sm:grid-cols-2">
        {REVIEWS.map((r) => (
          <article key={r.name} className="bg-surface rounded-xl border p-4">
            <Quote className="text-brand-orange-500/50 h-5 w-5" />
            <p className="text-text mt-2 text-[13px] leading-relaxed">{r.quote}</p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
              <div className="min-w-0">
                <p className="text-text truncate text-[12.5px] font-medium">{r.name}</p>
                <p className="text-text-subtle truncate text-[11px]">
                  {r.title} · {r.company}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={
                      i <= r.rating
                        ? "fill-brand-orange-500 text-brand-orange-500 h-3.5 w-3.5"
                        : "text-border-subtle h-3.5 w-3.5"
                    }
                  />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Badge tone="muted" size="md" className="mt-6">
        Average rating: 4.8 / 5 across 47 reviews
      </Badge>
    </HelpShell>
  );
}

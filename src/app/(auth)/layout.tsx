import Link from "next/link";
import { Boxes, Shield, Sparkles, Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="bg-portfolio-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        {/* Decorative dots */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,1) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,147,62,0.35) 0%, transparent 60%)",
          }}
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="from-brand-orange-400 to-brand-orange-600 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-pop">
              <Boxes className="h-5 w-5 text-white" strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-medium tracking-tight">AssetArt</span>
          </Link>
        </div>

        <div className="relative space-y-7 max-w-md">
          <p className="text-brand-orange-300 text-[11px] font-semibold uppercase tracking-[0.2em]">
            Enterprise asset intelligence
          </p>
          <h1 className="text-[44px] font-medium leading-[1.05] tracking-tight">
            Every device, lease, and license — in one calm command center.
          </h1>
          <p className="text-brand-navy-100 text-[14px] leading-relaxed">
            Track 60,000 assets without the spreadsheet sprawl. Built for IT and operations teams who treat data like infrastructure.
          </p>

          <ul className="grid gap-2.5 pt-2">
            {[
              { icon: Sparkles, text: "AI-assisted categorization and predictive alerts" },
              { icon: Zap, text: "Linear-fast command palette — every action one keystroke away" },
              { icon: Shield, text: "Audit log of every move, swap, and signature" },
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-[13px] text-brand-navy-50/90 animate-fade-in-up"
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                  <item.icon className="h-3.5 w-3.5 text-brand-orange-300" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-brand-navy-200 relative flex items-center justify-between text-[11px]">
          <span>© {new Date().getFullYear()} AssetArt</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="bg-surface flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-[400px] animate-fade-in-up">{children}</div>
      </main>
    </div>
  );
}

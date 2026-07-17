import Link from "next/link";
import { ArrowRight, FileText, ScrollText, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOMEPAGE_STATS } from "@/config/home-page";

export function HeroSection() {
  return (
    <section className="grid-bg relative overflow-hidden bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto grid max-w-7xl min-w-0 items-center gap-14 lg:grid-cols-[1fr_1fr]">
        <div className="min-w-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-1.5">
            <FileText className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
            <span className="text-xs font-semibold text-brand-foreground-muted">
              AI-powered resumes. One-click tracking.
            </span>
          </div>

          <h1 className="mb-5 break-words font-bold text-5xl leading-[1.06] tracking-[-0.03em] text-brand-foreground md:text-6xl">
            Stop copy-pasting.
            <br />
            <span className="text-brand-primary">Start landing.</span>
          </h1>

          <p className="mb-5 max-w-lg break-words text-base leading-relaxed text-brand-foreground-muted">
            Paste any job link. Get a tailored, ATS-ready resume in seconds.
          </p>

          <div className="mb-8 flex max-w-xl flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-foreground-muted">
              <FileText className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
              AI Resume Builder
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-foreground-muted">
              <ScrollText className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
              ATS-Ready
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-foreground-muted">
              <LayoutDashboard className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
              Application Tracker
            </span>
          </div>

          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/seeker/register">
                Start Landing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/dashboard/browse">
                Browse Open Jobs
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {HOMEPAGE_STATS.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <p className="text-lg font-bold text-brand-foreground">{stat.value}</p>
                <p className="text-xs text-brand-foreground-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden min-h-[400px] lg:block">
          <div className="flex h-full items-center justify-center rounded-xl border border-brand-border bg-brand-surface p-8">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-brand-primary/40" aria-hidden="true" />
              <p className="text-sm text-brand-foreground-muted">
                Resume builder preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

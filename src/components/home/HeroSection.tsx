import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, ScrollText, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame } from "@/components/home/BrowserFrame";
import { HOMEPAGE_STATS } from "@/config/home-page";

export function HeroSection() {
  return (
    <section className="grid-bg relative overflow-hidden bg-white px-4 pt-20 md:px-8 md:pt-24">
      <div className="relative z-10 mx-auto max-w-4xl min-w-0 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-1.5">
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

        <p className="mx-auto mb-5 max-w-xl break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg">
          Paste any job link. Get a tailored, ATS-ready resume in seconds.
        </p>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
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

        <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="primary" size="lg">
            <Link href="/seeker/register">
              Start Landing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {/* <Button asChild variant="secondary" size="lg">
            <Link href="/dashboard/browse">
              Browse Open Jobs
            </Link>
          </Button> */}
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {HOMEPAGE_STATS.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <p className="text-lg font-bold text-brand-foreground">{stat.value}</p>
              <p className="text-xs text-brand-foreground-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot collage */}
      <div className="relative mx-auto mt-14 max-w-5xl px-4 pb-0">
        <div className="relative mx-auto max-w-[90%] lg:max-w-[85%]">
          {/* Dashboard peeks from behind — hidden on mobile */}
          <div className="hidden md:block absolute -left-6 -bottom-6 lg:-left-10 lg:-bottom-10 w-[88%] z-10 -rotate-1">
            <BrowserFrame>
              <Image
                src="/images/dashboard.png"
                alt="Hiretivo dashboard with recommended jobs and application tracker"
                width={1694}
                height={929}
                className="w-full h-auto"
                priority
              />
            </BrowserFrame>
          </div>
          {/* Resume Engine — front and center */}
          <div className="relative z-20 md:rotate-[0.5deg]">
            <BrowserFrame>
              <Image
                src="/images/resume-engine.png"
                alt="AI resume editor with rewrite tools, templates, and PDF export"
                width={1324}
                height={1188}
                className="w-full h-auto"
                priority
              />
            </BrowserFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

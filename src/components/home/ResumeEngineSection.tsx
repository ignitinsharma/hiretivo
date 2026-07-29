import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESUME_ENGINE_SECTION } from "@/config/home-page";
import { MatchRing } from "@/components/shared/MatchRing";

export function ResumeEngineSection() {
  const { eyebrow, heading, body, bullets, linkText, linkHref } =
    RESUME_ENGINE_SECTION;

  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
          <div className="min-w-0 lg:col-span-2">
            <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              {eyebrow}
            </p>
            <h2 className="break-words text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
              {heading}
            </h2>
            <p className="mt-4 break-words text-base leading-relaxed text-brand-foreground-muted">
              {body}
            </p>

            <ul className="mt-6 space-y-3" role="list">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-relaxed text-brand-foreground">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button asChild variant="primary" size="lg">
                <Link href={linkHref}>
                  {linkText}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-3">
            <div className="relative mx-auto max-w-xl">
              {/* Before — generic resume, peeking behind */}
              <div className="absolute left-0 top-8 z-10 w-[52%] -rotate-3">
                <span className="absolute -top-3 left-3 z-20 rounded-pill border border-brand-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-foreground-muted">
                  Before
                </span>
                <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
                  <Image
                    src="/images/resume-before.png"
                    alt="Generic, unoptimized resume with vague bullet points"
                    width={1103}
                    height={1426}
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* AI Match Score — floating between before/after */}
              <div className="hidden lg:block absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rotate-0">
                <div className="rounded-xl border border-brand-border bg-white px-3 py-2 text-center">
                  <MatchRing score={92} size={56} className="mx-auto" />
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground-muted">
                    AI Match
                  </p>
                </div>
              </div>

              {/* After — AI-optimized resume, front */}
              <div className="relative z-20 ml-auto w-[62%] rotate-1">
                <span className="absolute -top-3 right-3 z-20 inline-flex items-center gap-1 rounded-pill bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  AI Rewrote This
                </span>
                <div className="overflow-hidden rounded-xl border border-brand-primary/30 bg-white">
                  <Image
                    src="/images/resume-after.png"
                    alt="AI-optimized resume with highlighted improvements"
                    width={820}
                    height={1125}
                    className="w-full h-auto"
                  />
                </div>
              </div>

            </div>

            {/* AI transformation caption */}
            <p className="mx-auto mt-5 max-w-md text-center text-sm text-brand-foreground-muted animate-in fade-in slide-in-from-bottom-4">
              AI strengthens every bullet — stronger verbs, quantified metrics, keywords the ATS scans for.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

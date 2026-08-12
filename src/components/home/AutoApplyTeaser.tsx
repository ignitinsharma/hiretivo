/*
 * AutoApplyTeaser
 * Coming-soon banner for the auto-apply vision — "You approve. We apply."
 * Split layout: copy + CTA on the left, a static mock of the approve flow on
 * the right. Launch-day announcement goes out through existing user channels.
 */

import Link from "next/link";
import { Rocket, Sparkles, Check, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFreeGenerationLimit, isFreeGenerationPromoActive } from "@/constants/pricing";

const READY_STEPS = [
  { label: "Resume tailored to this JD" },
  { label: "Cover letter drafted" },
] as const;

/*
 * ApproveFlowMock
 * Static mock of the one-click approve flow — job card, ready checklist,
 * approve CTA, and applied state. Decorative, aria-hidden.
 */
function ApproveFlowMock() {
  return (
    <div className="mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="rounded-xl border border-brand-border bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-foreground">
              Senior Frontend Engineer
            </p>
            <p className="mt-0.5 text-xs text-brand-foreground-muted">
              Stripe · Remote
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-brand-primary/[0.08] px-2.5 py-1 text-xs font-bold text-brand-primary">
            <Sparkles className="h-3 w-3 animate-pulse" aria-hidden="true" />
            92% match
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {READY_STEPS.map((step) => (
            <li
              key={step.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-surface px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-brand-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                <span className="truncate">{step.label}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-success">
                <Check className="h-3 w-3" aria-hidden="true" />
                Ready
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-2">
          <span className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-primary text-sm font-bold text-white">
            Approve &amp; Apply
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-brand-foreground-secondary" aria-hidden="true" />
          <span className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-success/30 bg-brand-success/[0.06] text-sm font-bold text-brand-success">
            <Check className="h-4 w-4" aria-hidden="true" />
            Applied
          </span>
        </div>
      </div>

      <div className="mx-auto -mt-1 w-fit rounded-pill border border-brand-border bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-foreground-secondary">
        Coming soon
      </div>
    </div>
  );
}

/*
 * AutoApplyTeaser
 * Renders the coming-soon banner with copy, CTA, and the approve-flow mock.
 * No props, no client state, no data fetching.
 */
export function AutoApplyTeaser() {
  return (
    <section className="grid-bg relative overflow-hidden border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto w-full max-w-7xl min-w-0">
        <div className="relative overflow-hidden rounded-xl border border-brand-primary/25 bg-white px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-primary/[0.07]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand-primary/[0.05]"
            aria-hidden="true"
          />

          <div className="relative grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="min-w-0 text-center lg:text-left">
              <p className="inline-flex items-center gap-1.5 rounded-pill border border-brand-border bg-brand-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-primary">
                <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                Coming Soon
              </p>

              <h2 className="mt-6 break-words text-4xl font-bold leading-[1.12] tracking-tight text-brand-foreground sm:text-5xl">
                You approve.{" "}
                <span className="text-brand-primary">We apply.</span>
              </h2>

              <p className="mx-auto mt-5 max-w-lg break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg lg:mx-0">
                Auto-apply is coming. Start free today — the day it ships,
                it&apos;s waiting in your account.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Button asChild variant="primary" size="lg">
                  <Link href="/seeker/register">
                    Start Free
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-xs font-medium text-brand-foreground-muted">
                  No credit card · {getFreeGenerationLimit()} AI resumes/mo free
                  {isFreeGenerationPromoActive() ? " · limited time" : ""}
                </p>
              </div>
            </div>

            <ApproveFlowMock />
          </div>
        </div>
      </div>
    </section>
  );
}

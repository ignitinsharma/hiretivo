/*
 * SeekerCTASection
 * Final conversion CTA for job seekers.
 * Fully static — no props, client state, or data fetching.
 */

import Link from "next/link";
import { ArrowRight, ShieldCheck, CreditCard, Zap, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/config/home-page";

interface TrustItem {
  icon: LucideIcon;
  label: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, label: "2 Free / month" },
  { icon: CreditCard, label: "No Credit Card" },
  { icon: Zap, label: "5-min Setup" },
];

/*
 * TrustPill
 * Renders one compact trust signal beneath the primary CTA.
 */
function TrustPill({ item }: { item: TrustItem }) {
  const Icon = item.icon;

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full bg-brand-surface px-3 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/[0.08] text-brand-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="truncate text-xs font-semibold text-brand-foreground">
        {item.label}
      </span>
    </div>
  );
}

/*
 * SeekerCTASection
 * Renders the final conversion CTA with trust signals.
 */
export function SeekerCTASection() {
  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="relative grid min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white lg:grid-cols-[0.92fr_1.08fr]">
          <span
            className="absolute left-0 top-0 h-full w-1 bg-brand-primary"
            aria-hidden="true"
          />

          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Start your job search
            </p>

            <h2 className="mt-6 max-w-xl break-words text-4xl font-bold leading-[1.12] tracking-tight text-brand-foreground sm:text-5xl">
              2 free AI resumes.
              <br />
              <span className="text-brand-primary">Every month. No credit card.</span>
            </h2>

            <p className="mt-8 max-w-md break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg">
              Two tailored, ATS-ready resumes every month — zero commitment.
              Renews automatically.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button asChild variant="primary" size="lg">
                <Link href="/seeker/register">
                  Get Started Free
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-2 rounded-xl border border-brand-border bg-white p-2 sm:grid-cols-3">
              {TRUST_ITEMS.map((item) => (
                <TrustPill key={item.label} item={item} />
              ))}
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center border-t border-brand-border p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-12">
            {(() => {
              const testimonial = TESTIMONIALS[0];
              return (
                <figure className="w-full max-w-sm rounded-xl border border-brand-border bg-white p-6">
                  <div
                    className="flex gap-0.5"
                    role="img"
                    aria-label={`${testimonial.stars} out of 5 stars`}
                  >
                    {Array.from({ length: testimonial.stars }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-brand-primary text-brand-primary"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 break-words text-sm leading-relaxed text-brand-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/[0.08] text-xs font-bold text-brand-primary">
                      {testimonial.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-brand-foreground">
                        {testimonial.name}
                      </span>
                      <span className="block truncate text-xs text-brand-foreground-muted">
                        {testimonial.title}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

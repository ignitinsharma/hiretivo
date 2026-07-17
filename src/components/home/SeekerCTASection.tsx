/*
 * SeekerCTASection
 * Final conversion CTA for job seekers.
 * Fully static — no props, client state, or data fetching.
 */

import Link from "next/link";
import { ArrowRight, ShieldCheck, CreditCard, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrustItem {
  icon: LucideIcon;
  label: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, label: "100% Free" },
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
              Your first resume is free.
              <br />
              <span className="text-brand-primary">No credit card required.</span>
            </h2>

            <p className="mt-8 max-w-md break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg">
              Stop copy-pasting the same resume. Start landing interviews with
              AI-tailored resumes.
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
            <div className="flex h-full min-h-[200px] w-full items-center justify-center rounded-xl border border-brand-border bg-brand-surface">
              <div className="text-center">
                <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-brand-primary/40" aria-hidden="true" />
                <p className="text-sm text-brand-foreground-muted">Free forever. No strings attached.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

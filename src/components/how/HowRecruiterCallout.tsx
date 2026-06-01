import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

const RECRUITER_POINTS = [
  "Review verified skills before unlocking profiles",
  "See salary range and availability upfront",
  "Build a cleaner remote hiring pipeline",
] as const;

/*
 * HowRecruiterCallout
 * Keeps recruiter messaging present without competing with the seeker-first page.
 */
export function HowRecruiterCallout() {
  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-xl border border-brand-border bg-white p-6 md:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
            For recruiters
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-brand-foreground">
            Hiring remote engineers?
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-foreground-muted">
            Hiretivo gives your team a talent pool where skills, salary range,
            and availability are easier to evaluate before the first call.
          </p>
        </div>

        <div>
          <div className="mb-5 space-y-3">
            {RECRUITER_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-semibold text-brand-foreground">
                <Check className="h-4 w-4 text-brand-success" aria-hidden="true" />
                {point}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary">
              <Link href="/recruiter/register">
                Start hiring
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/hire-talent">View recruiter flow</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

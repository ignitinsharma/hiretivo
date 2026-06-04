import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/*
 * HowFinalCTASection
 * Renders a light final CTA that transitions cleanly into the dark footer.
 */
export function HowFinalCTASection() {
  return (
    <section className="bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="grid-bg mx-auto max-w-7xl rounded-xl border border-brand-border bg-brand-surface p-8 text-center md:p-14">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
          Ready when you are
        </p>
        <h2 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-[-0.03em] text-brand-foreground md:text-5xl">
          Build a profile recruiters can trust.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-brand-foreground-muted md:text-lg">
          Create your free seeker profile and start reviewing roles with real
          match context instead of guessing from job descriptions.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="primary">
            <Link href="/seeker/register">
              Create free profile
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

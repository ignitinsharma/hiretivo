import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HireTalentFinalCTA() {
  return (
    <section className="bg-white px-4 py-16 md:px-8">
      <div className="grid-bg mx-auto max-w-5xl rounded-xl border border-brand-border bg-white p-8 text-center md:p-12">
        <p className="text-sm font-bold uppercase tracking-normal text-brand-primary">
          Recruiter signup
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-normal text-brand-foreground md:text-4xl">
          Start with verified talent, not resume noise.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-foreground-muted">
          Create a recruiter account to browse verified Indian engineers, use
          profile unlocks, and invite the right people into your hiring flow.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
            <Link href="/recruiter/register">
              Start hiring
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

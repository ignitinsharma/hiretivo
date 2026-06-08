import Link from "next/link";
import { ArrowRight, Check, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const MATCHED_ROLES = [
  {
    title: "Senior React Engineer",
    company: "Remote SaaS team",
    signal: "Strong fit",
  },
  {
    title: "Frontend Platform Engineer",
    company: "US product studio",
    signal: "Skills aligned",
  },
] as const;

/*
 * HowHeroSection
 * Renders the seeker-first hero with primary CTAs and a compact product preview.
 */
export function HowHeroSection() {
  return (
    <section className="grid-bg border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-brand-foreground-muted">
              Skills-first remote matching
            </span>
          </div>

          <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-brand-foreground md:text-7xl">
            Know which remote roles are worth your time.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-[1.75] text-brand-foreground-muted md:text-xl">
            Hiretivo turns your verified skills, salary expectations, and
            availability into clear role context before you apply.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <div className="rounded-xl border border-brand-border bg-white p-4 md:p-6">
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 border-b border-brand-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-primary">
                  Profile readiness
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-foreground">
                  Verified profile signals
                </h2>
              </div>
              <span className="rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-brand-primary">
                Live preview
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {["React", "Node.js", "AWS"].map((skill) => (
                <div
                  key={skill}
                  className="rounded-lg border border-brand-border bg-white p-3"
                >
                  <Check className="mb-3 h-4 w-4 text-brand-success" aria-hidden="true" />
                  <p className="text-sm font-bold text-brand-foreground">{skill}</p>
                  <p className="text-xs text-brand-foreground-muted">
                    Verified skill
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-brand-border bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-brand-foreground">
                    Matched roles
                  </p>
                  <p className="text-xs text-brand-foreground-muted">
                    Explained by verified profile signals
                  </p>
                </div>
                <Send className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              </div>

              <div className="space-y-3">
                {MATCHED_ROLES.map((role) => (
                  <div
                    key={role.title}
                    className="flex items-center justify-between gap-4 rounded-lg border border-brand-border bg-brand-surface px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-brand-foreground">
                        {role.title}
                      </p>
                      <p className="text-xs text-brand-foreground-muted">
                        {role.company}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-lg border border-brand-primary/20 bg-white px-2.5 py-1 text-xs font-bold text-brand-primary">
                      {role.signal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { ComponentType } from "react";
import { Check, Clock, DollarSign, Gauge, Layers, MapPin } from "lucide-react";

interface SignalItem {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const SIGNALS: SignalItem[] = [
  {
    title: "Skill overlap",
    description:
      "Required skills are compared against your verified profile, not just resume keywords.",
    icon: Layers,
  },
  {
    title: "Timezone fit",
    description:
      "Remote overlap and working style are shown before you spend time applying.",
    icon: Clock,
  },
  {
    title: "Salary clarity",
    description:
      "Recruiters see your range early, so mismatched compensation does not waste your pipeline.",
    icon: DollarSign,
  },
] as const;

const SCORE_ROWS = [
  { label: "React + TypeScript", value: "Strong", width: "w-[88%]" },
  { label: "Remote overlap", value: "5 hrs", width: "w-[74%]" },
  { label: "Salary range fit", value: "Aligned", width: "w-[82%]" },
] as const;

/*
 * HowMatchingSection
 * Explains how Hiretivo creates practical match signals for seekers.
 */
export function HowMatchingSection() {
  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
            How matching works
          </p>
          <h2 className="max-w-xl text-4xl font-bold leading-tight tracking-[-0.03em] text-brand-foreground md:text-5xl">
            A match score should explain itself.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-[1.75] text-brand-foreground-muted md:text-lg">
            The page should feel like a product, not a promise. Each role shows
            why it fits, where it is weak, and what a recruiter will evaluate.
          </p>

          <div className="mt-8 space-y-4">
            {SIGNALS.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-brand-border bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-surface">
                  <Icon className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-4 md:p-6">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <div className="flex items-start justify-between gap-4 border-b border-brand-border pb-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">
                  AN
                </div>
                <div>
                  <p className="font-bold leading-tight text-brand-foreground">
                    Arjun Nair
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-foreground-secondary">
                    Senior React Engineer
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-primary">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[160px_1fr]">
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-center">
                <Gauge className="mx-auto mb-3 h-5 w-5 text-brand-primary" aria-hidden="true" />
                <p className="text-4xl font-bold leading-none tracking-tight text-brand-foreground">
                  84
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-foreground-secondary">
                  Match score
                </p>
              </div>

              <div className="space-y-4">
                {SCORE_ROWS.map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-semibold text-brand-foreground">
                        {row.label}
                      </span>
                      <span className="font-bold text-brand-primary">
                        {row.value}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-brand-surface">
                      <div className={`${row.width} h-2 rounded-full bg-brand-primary`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-brand-border bg-brand-surface p-3">
                <MapPin className="mb-2 h-4 w-4 text-brand-primary" aria-hidden="true" />
                <p className="text-sm font-bold text-brand-foreground">
                  Remote overlap
                </p>
                <p className="text-xs text-brand-foreground-muted">
                  5 hours with US teams
                </p>
              </div>
              <div className="rounded-lg border border-brand-border bg-brand-surface p-3">
                <DollarSign className="mb-2 h-4 w-4 text-brand-primary" aria-hidden="true" />
                <p className="text-sm font-bold text-brand-foreground">
                  Salary range
                </p>
                <p className="text-xs text-brand-foreground-muted">
                  $90k-$120k / yr visible
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

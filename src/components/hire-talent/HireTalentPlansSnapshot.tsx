interface PlanSnapshot {
  name: string;
  unlocks: string;
  jobs: string;
  note: string;
}

const PLANS: PlanSnapshot[] = [
  {
    name: "Free",
    unlocks: "0 unlocks",
    jobs: "0 jobs",
    note: "Browse blurred profiles",
  },
  {
    name: "Starter",
    unlocks: "10 unlocks/month",
    jobs: "2 jobs",
    note: "Good for first recruiter-led outreach",
  },
  {
    name: "Growth",
    unlocks: "30 unlocks/month",
    jobs: "Unlimited jobs",
    note: "For active hiring teams",
  },
  {
    name: "Scale",
    unlocks: "Unlimited unlocks",
    jobs: "Unlimited jobs",
    note: "For continuous pipeline building",
  },
];

export function HireTalentPlansSnapshot() {
  return (
    <section className="bg-brand-surface px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-normal text-brand-primary">
            Plans snapshot
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-brand-foreground md:text-4xl">
            Pick unlock volume by hiring intent.
          </h2>
        </div>

        <div className="grid overflow-hidden rounded-xl border border-brand-border bg-white md:grid-cols-4">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className="border-b border-brand-border p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <h3 className="text-xl font-bold text-brand-foreground">
                {plan.name}
              </h3>
              <div className="mt-5 space-y-3">
                <p className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm font-semibold text-brand-foreground">
                  {plan.unlocks}
                </p>
                <p className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm font-semibold text-brand-foreground">
                  {plan.jobs}
                </p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-brand-foreground-muted">
                {plan.note}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

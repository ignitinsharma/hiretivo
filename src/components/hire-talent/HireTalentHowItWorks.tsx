import { BriefcaseBusiness, Search, Send, Unlock } from "lucide-react";

interface WorkStep {
  step: string;
  title: string;
  description: string;
  icon: typeof Search;
}

const WORK_STEPS: WorkStep[] = [
  {
    step: "01",
    title: "Browse verified profiles",
    description:
      "Filter the talent pool by skills, role, salary range, timezone overlap, and availability.",
    icon: Search,
  },
  {
    step: "02",
    title: "Unlock full profile",
    description:
      "Reveal the engineer's full name and contact details when the Hiretivo score and profile fit look right.",
    icon: Unlock,
  },
  {
    step: "03",
    title: "Save, invite, or post a role",
    description:
      "Save engineers for later, invite unlocked profiles to interview, or publish a role for inbound matches.",
    icon: Send,
  },
];

export function HireTalentHowItWorks() {
  return (
    <section className="bg-brand-surface px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-brand-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-brand-foreground md:text-4xl">
              A short path from search to serious outreach.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-foreground-muted">
              The recruiter flow is built around the talent pool first, then
              profile unlocks and role-based invitations.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {WORK_STEPS.map(({ step, title, description, icon: Icon }) => (
              <article
                key={step}
                className="rounded-xl border border-brand-border bg-white p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-brand-primary">
                    {step}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-foreground">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-foreground-muted">
          <BriefcaseBusiness className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
          Posting jobs is still available for recruiters, but the talent pool is
          the fastest way to start with verified engineers.
        </div>
      </div>
    </section>
  );
}

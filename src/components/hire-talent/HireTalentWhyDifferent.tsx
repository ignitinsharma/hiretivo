import { BadgeCheck, Eye, LockKeyhole } from "lucide-react";

interface DifferenceItem {
  title: string;
  description: string;
  icon: typeof BadgeCheck;
}

const DIFFERENCES: DifferenceItem[] = [
  {
    title: "Verified before you see them",
    description:
      "Profiles are built around verified skills, public work signals, and a Hiretivo score recruiters can scan quickly.",
    icon: BadgeCheck,
  },
  {
    title: "Salary and availability upfront",
    description:
      "Recruiters see salary ranges and availability before outreach, so both sides start with clear expectations.",
    icon: Eye,
  },
  {
    title: "Unlock only when there is intent",
    description:
      "Browse with privacy intact, then reveal contact details when a profile is worth a serious conversation.",
    icon: LockKeyhole,
  },
];

export function HireTalentWhyDifferent() {
  return (
    <section className="border-b border-brand-border bg-white px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-normal text-brand-primary">
            Why different
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-brand-foreground md:text-4xl">
            Less resume noise. More verified context.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-foreground-muted">
            Hiretivo gives recruiters the signal needed to decide who is worth
            unlocking before collecting another cold inbox thread.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {DIFFERENCES.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-xl border border-brand-border bg-white p-6"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold tracking-normal text-brand-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

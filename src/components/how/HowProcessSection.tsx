import { CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    label: "01",
    title: "Create your profile",
    description:
      "Add your role, verified skills, salary range, availability, and remote preferences.",
  },
  {
    label: "02",
    title: "Get verified",
    description:
      "Hiretivo turns your profile into a clearer signal recruiters can trust.",
  },
  {
    label: "03",
    title: "Review matched roles",
    description:
      "See role fit with skill, timezone, and salary context before applying.",
  },
  {
    label: "04",
    title: "Apply with context",
    description:
      "Send stronger applications because the important expectations are already visible.",
  },
] as const;

/*
 * HowProcessSection
 * Shows the seeker workflow as a restrained timeline.
 */
export function HowProcessSection() {
  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
            The seeker workflow
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-[-0.03em] text-brand-foreground md:text-5xl">
            Four steps from profile to focused applications.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.label}
              className="rounded-xl border border-brand-border bg-white p-5"
            >
              <div className="mb-8 flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
                  {step.label}
                </span>
                <CheckCircle2 className="h-4 w-4 text-brand-success" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-brand-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

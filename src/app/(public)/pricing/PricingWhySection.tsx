import { ShieldCheck, Target, Users, Zap, type LucideIcon } from "lucide-react";

interface WhyProp {
  Icon: LucideIcon;
  heading: string;
  body: string;
}

const WHY_PROPS: WhyProp[] = [
  {
    Icon: ShieldCheck,
    heading: "Pre-vetted, not just applied",
    body: "Every engineer on Hiretivo passes a skills verification. No ghosting, no inflated CVs.",
  },
  {
    Icon: Target,
    heading: "Match score before you spend",
    body: "See exactly how well each engineer fits your job before using an unlock. Pay only for the right fit.",
  },
  {
    Icon: Users,
    heading: "India's top 10% for global roles",
    body: "Talent that competes with US/EU hires at a fraction of the cost. Senior engineers, not fresh grads.",
  },
  {
    Icon: Zap,
    heading: "Hire in days, not months",
    body: "Unlock → full contact details instantly. No recruiter middlemen, no 6-week agency timelines.",
  },
];

/*
 * PricingWhySection
 * Value-prop grid shown between hero headline and billing toggle on /pricing.
 * Gives US/EU recruiters a reason to trust Hiretivo before seeing prices.
 */
export function PricingWhySection() {
  return (
    <section className="py-12 border-t border-b border-brand-border">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center font-medium text-xs uppercase tracking-wider text-brand-foreground-muted mb-10">
          Why Hiretivo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {WHY_PROPS.map((prop) => (
            <div key={prop.heading} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center">
                <prop.Icon className="w-4 h-4 text-brand-primary" strokeWidth={2} aria-hidden />
              </div>
              <h3 className="font-semibold text-base text-brand-foreground leading-snug tracking-tight">
                {prop.heading}
              </h3>
              <p className="text-sm text-brand-foreground-muted leading-relaxed">{prop.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

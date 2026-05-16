import Link from "next/link";
import { ArrowRight, ShieldCheck, Github, Globe, DollarSign, BadgeCheck } from "lucide-react";

const STEPS = [
  {
    icon: Github,
    title: "Connect GitHub",
    description: "Link your profile. We scan your public repos.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Review",
    description: "Our team manually reviews your profile within 48 hours.",
  },
  {
    icon: BadgeCheck,
    title: "Get Verified",
    description: "Blue ✓ badge live. Hiretivo Score assigned.",
  },
  {
    icon: Globe,
    title: "Get Discovered",
    description: "US/EU startups find you. Get paid in USD.",
  },
];

export function ForEngineersSection() {
  return (
    <section
      className="bg-brand-surface py-20 md:py-24"
      data-purpose="for-engineers"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
            Get Hiretivo Verified{" "}
            <span className="inline-flex items-center text-brand-primary">
              <BadgeCheck className="ml-1 h-7 w-7" />
            </span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-brand-foreground-muted md:text-lg">
            Free forever. Get discovered by US/EU startups. Paid in USD.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <Icon className="h-7 w-7 text-brand-primary" />
                </div>
                <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                  {index + 1}
                </div>
                <h3 className="mb-1 text-base font-bold text-brand-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-brand-foreground-muted">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/seeker/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-[#5a47d9]"
          >
            Get Verified — Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

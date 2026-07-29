/*
 * FeaturesSection
 * 3-column differentiator cards showcasing seeker-facing product capabilities.
 * Fully static — no props, client state, or data fetching.
 */

import { FileText, ScrollText, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SEEKER_FEATURES } from "@/config/home-page";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURE_ICONS: LucideIcon[] = [FileText, ScrollText, LayoutDashboard];

/*
 * FeaturesSection
 * Renders a 3-column grid of seeker feature cards.
 */
export function FeaturesSection() {
  const features: FeatureCard[] = SEEKER_FEATURES.map((f, i) => ({
    icon: FEATURE_ICONS[i],
    title: f.title,
    description: f.description,
  }));

  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="mx-auto mb-14 max-w-2xl min-w-0 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            Built for job seekers
          </p>
          <h2 className="break-words text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
            Everything you need to land your next role.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group rounded-xl border border-brand-border bg-white p-6 transition-colors hover:border-brand-primary/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-bold leading-snug tracking-tight text-brand-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

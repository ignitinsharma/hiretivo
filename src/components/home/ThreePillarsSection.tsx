import { ShieldCheck, DollarSign, MapPin } from "lucide-react";
import { THREE_PILLARS } from "@/config/home-page";

const ICONS = {
  "shield-check": ShieldCheck,
  "dollar-sign": DollarSign,
  "map-pin": MapPin,
} as const;

/*
 * ThreePillarsSection
 * Homepage section: Verified / Salary Transparency / India-First Identity.
 * Three cards side by side on desktop, stacked on mobile.
 */
export function ThreePillarsSection() {
  return (
    <section className="bg-brand-surface px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bold text-3xl text-brand-foreground text-center mb-10 tracking-tight">
          Why Hiretivo works
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {THREE_PILLARS.map((pillar) => {
            const Icon = ICONS[pillar.icon as keyof typeof ICONS];
            return (
              <div
                key={pillar.id}
                className="rounded-xl border border-brand-border bg-white p-6 flex flex-col gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Icon className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-semibold text-xl text-brand-foreground">
                  {pillar.title}
                </h3>
                <p className="text-sm text-brand-foreground-muted leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

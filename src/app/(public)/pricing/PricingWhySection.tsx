import { ShieldCheck, Users, ClipboardCheck, TrendingUp, type LucideIcon } from "lucide-react";

interface Feature {
  Icon: LucideIcon;
  titleLine1: string;
  titleLine2: string;
  description: string;
  accent: string;
  iconColor: string;
}

const FEATURES: Feature[] = [
  {
    Icon: Users,
    titleLine1: "Pre-vetted",
    titleLine2: "engineers",
    description: "Every engineer passes manual verification. No ghosting, no inflated CVs.",
    accent: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    Icon: ClipboardCheck,
    titleLine1: "Match score",
    titleLine2: "first",
    description: "See exactly how well an engineer fits before spending credits.",
    accent: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    Icon: TrendingUp,
    titleLine1: "India's",
    titleLine2: "top 10%",
    description: "Senior engineers competing for global remote opportunities.",
    accent: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    Icon: ShieldCheck,
    titleLine1: "Hire in",
    titleLine2: "days",
    description: "Direct access to verified talent without recruiters or agencies.",
    accent: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

/*
 * PricingWhySection
 * "Why Hiretivo?" value-props section rendered above the hero on /pricing.
 */
export function PricingWhySection() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-sm font-medium text-violet-700">
            Built for recruiters
          </span>

          <h2 className="mt-6 text-[32px] font-bold tracking-tight text-slate-950">
            Why Hiretivo?
          </h2>

          <p className="mt-4 text-xl text-slate-500">
            Everything you need to find, evaluate, and hire the right engineers faster.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-20 grid grid-cols-4 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.Icon;
            return (
              <div
                key={feature.titleLine1}
                className="group relative rounded-[24px] border border-slate-200 bg-white p-7 transition-colors hover:border-slate-300"
              >
                {/* Icon */}
                <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.accent}`}>
                  <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-[20px] font-semibold leading-[1.35] text-slate-900">
                  {feature.titleLine1}
                  <br />
                  {feature.titleLine2}
                </h3>

                <div className="mt-5 h-[3px] w-10 rounded-full bg-violet-500" />

                <p className="mt-6 text-[15px] leading-9 text-slate-500">
                  {feature.description}
                </p>

                {/* Decorative dots */}
                <div className="absolute bottom-5 left-7 flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

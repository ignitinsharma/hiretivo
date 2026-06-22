import { ShieldCheck, Users, ClipboardList, TrendingUp, type LucideIcon } from "lucide-react";

interface Feature {
  Icon: LucideIcon;
  title: string;
  description: string;
  bottomBg?: string;
  dotColor: string;
}

/*
 * Icon bg and color are uniform across all cards (indigo-100 / indigo-600)
 * matching the screenshot — only the bottom panel and dots differ per card.
 */
const FEATURES: Feature[] = [
  {
    Icon: Users,
    title: "Precision talent matching",
    description:
      "Our AI matches candidates to your job requirements with high accuracy, so you see only the most relevant profiles.",
    dotColor: "bg-indigo-300",
  },
  {
    Icon: ClipboardList,
    title: "Smarter screening, less effort",
    description:
      "Automated screening, skill evaluation, and AI summaries save hours of manual work.",
    dotColor: "bg-indigo-300",
  },
  {
    Icon: TrendingUp,
    title: "Data-driven hiring decisions",
    description:
      "Actionable insights and analytics help you make confident, unbiased hiring decisions.",
    bottomBg: "bg-green-50",
    dotColor: "bg-green-400",
  },
  {
    Icon: ShieldCheck,
    title: "Fair, inclusive & compliant",
    description:
      "Reduce bias and stay compliant with a fair and transparent hiring process.",
    bottomBg: "bg-orange-50",
    dotColor: "bg-orange-300",
  },
];

/*
 * PricingWhySection
 * Pixel-matched to the "Why Hiretivo?" screenshot — 4-column card grid with
 * circular icon badges, centered text, indigo underline divider, and per-card
 * bottom-panel color (cards 3 & 4) + 3×4 dot decoration.
 */
export function PricingWhySection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* ── Header ── */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
            <span aria-hidden="true">✳</span>
            Built for recruiters
          </span>

          <h2 className="mt-5 text-[46px] font-bold tracking-tight text-slate-900">
            Why Hiretivo?
          </h2>

          <p className="mt-3 text-[17px] text-slate-500">
            Everything you need to find, evaluate, and hire the right talent—faster.
          </p>
        </div>

        {/* ── Cards ── */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.Icon;
            return (
              <div
                key={feature.title}
                className="relative flex min-h-[320px] flex-col items-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-7 pb-20 pt-9 text-center"
              >
                {/* Colored bottom panel (cards 3 & 4) */}
                {feature.bottomBg && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-28 ${feature.bottomBg}`}
                    aria-hidden="true"
                  />
                )}

                {/* Icon circle */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                  <Icon className="h-7 w-7 text-indigo-600" strokeWidth={1.75} />
                </div>

                {/* Title */}
                <h3 className="mt-8 text-[17px] font-bold leading-snug text-slate-900">
                  {feature.title}
                </h3>

                {/* Indigo underline */}
                <div className="mt-3 h-[2px] w-9 rounded-full bg-indigo-600" />

                {/* Description */}
                <p className="mt-5 text-[14px] leading-7 text-slate-500">
                  {feature.description}
                </p>

                {/* 3 × 4 dot grid */}
                <div
                  className="absolute bottom-[18px] left-6 z-10 grid grid-cols-4 gap-[6px]"
                  aria-hidden="true"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-[5px] w-[5px] rounded-full ${feature.dotColor}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

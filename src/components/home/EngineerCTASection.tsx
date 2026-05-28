import Link from "next/link"

import { Button } from "@/components/ui/button"

/*
 * EngineerCTASection
 * Dark band CTA section targeting Indian engineers as the secondary audience.
 * Promotes the Hiretivo verification badge and encourages engineers to apply for
 * USD-paying jobs at US/EU startups. Fully static — no props, no data fetching.
 */
export function EngineerCTASection() {
  const TRUST_CHIPS = [
    "✓ Free forever",
    "✓ USD salary visible to US/EU startups",
    "✓ Blue tick on your profile",
  ] as const

  return (
    <section className="bg-brand-foreground py-20 px-4 md:px-8">
      <div className="max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <p className="text-brand-primary text-xs font-semibold uppercase tracking-wider mb-4">
          Are you an Indian engineer?
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
          Get your Hiretivo ✓ badge.
          <br />
          Free forever.
        </h2>

        {/* Subtext */}
        <p className="text-brand-foreground-muted text-base leading-relaxed mb-8 max-w-xl mx-auto">
          Apply to jobs. Get discovered. Get paid in USD.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center">
          <Link href="/seeker/verification">
            <Button variant="primary" size="lg">
              Start Verification →
            </Button>
          </Link>
          <p className="text-xs text-brand-foreground-muted mt-3">
            Takes ~10 minutes
          </p>
        </div>

        {/* Trust chips */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {TRUST_CHIPS.map((chip) => (
            <span
              key={chip}
              className="text-xs font-semibold text-white border border-white/20 rounded-full px-3 py-1"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

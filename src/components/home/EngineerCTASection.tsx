import Link from "next/link"
import { Button } from "@/components/ui/button"

const TRUST_CHIPS = [
  "✓ Free forever",
  "✓ USD salary visible to US/EU startups",
  "✓ Blue tick on your profile",
] as const

/*
 * EngineerCTASection
 * Light-surface CTA targeting Indian engineers as secondary audience.
 * bg-brand-surface background matching WhyVerified section.
 * Tight heading, trust chips, verification CTA.
 * Fully static — no props, no data fetching.
 */
export function EngineerCTASection() {
  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        {/* Eyebrow */}
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.5px] text-brand-primary">
          Are you an Indian engineer?
        </p>

        {/* Heading */}
        <h2 className="mb-4 text-4xl font-bold leading-[1.05] tracking-[-1.5px] text-brand-foreground md:text-[44px]">
          Get your Hiretivo ✓ badge.<br />
          Free forever.
        </h2>

        {/* Subtext */}
        <p className="mb-8 text-[15px] leading-[1.7] text-brand-foreground-muted">
          Apply to jobs. Get discovered. Get paid in USD.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center">
          <Button asChild variant="primary" size="lg">
            <Link href="/seeker/verification">
              Start Verification →
            </Link>
          </Button>
          <p className="mt-3 text-xs text-brand-foreground-secondary">
            Takes ~10 minutes
          </p>
        </div>

        {/* Trust chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TRUST_CHIPS.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-brand-border px-3.5 py-1.5 text-xs font-semibold text-brand-foreground-muted"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

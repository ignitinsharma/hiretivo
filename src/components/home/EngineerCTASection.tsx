import Link from "next/link"
import { Button } from "@/components/ui/button"

const TRUST_CHIPS = [
  "✓ Free forever",
  "✓ USD salary visible to US/EU startups",
  "✓ Blue tick on your profile",
] as const

/*
 * EngineerCTASection
 * Dark band CTA targeting Indian engineers as secondary audience.
 * Near-black background with subtle purple radial glow from below.
 * Tight heading, trust chips, verification CTA.
 * Fully static — no props, no data fetching.
 */
export function EngineerCTASection() {
  return (
    <section className="relative overflow-hidden bg-brand-foreground px-4 py-20 md:px-8">
      {/* Purple glow — centered bottom */}
      <div
        className="pointer-events-none absolute bottom-[-100px] left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(117,96,255,0.12),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Eyebrow */}
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.5px] text-brand-primary">
          Are you an Indian engineer?
        </p>

        {/* Heading */}
        <h2 className="mb-4 text-4xl font-bold leading-[1.05] tracking-[-1.5px] text-white md:text-[44px]">
          Get your Hiretivo ✓ badge.<br />
          Free forever.
        </h2>

        {/* Subtext */}
        <p className="mb-8 text-[15px] leading-[1.7] text-white/30">
          Apply to jobs. Get discovered. Get paid in USD.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center">
          <Button asChild variant="primary" size="lg">
            <Link href="/seeker/verification">
              Start Verification →
            </Link>
          </Button>
          <p className="mt-3 text-xs text-white/20">
            Takes ~10 minutes
          </p>
        </div>

        {/* Trust chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TRUST_CHIPS.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/35"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

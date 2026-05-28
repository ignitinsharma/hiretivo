import { ShieldCheck, DollarSign, BadgeCheck } from 'lucide-react'

/*
 * WhyVerifiedSection
 * Renders the 3-pillar "Why Verified" trust section on the homepage.
 * Fully static — no props. Displays the Hiretivo Standard pillars:
 * pre-screened engineers, salary transparency, and India-first credential.
 */

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Pre-screened',
    description:
      'GitHub reviewed. Real projects, not forks. Admin-approved before you see them.',
    tagline: '"Talk to 3. Hire 1."',
  },
  {
    icon: DollarSign,
    title: 'Salary transparent',
    description:
      'USD ranges on both sides. No surprises. No wasted calls on mismatched expectations.',
    tagline: '"No surprises."',
  },
  {
    icon: BadgeCheck,
    title: 'India-first credential',
    description:
      'The Hiretivo ✓ badge. A signal US/EU startups learn to trust over time.',
    tagline: '"Your skills, globally visible."',
  },
]

export function WhyVerifiedSection() {
  return (
    <section className="bg-brand-surface py-20 px-4 md:px-8">
      {/* Section header */}
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            The Hiretivo Standard
          </p>
          <h2 className="mt-2 text-3xl font-bold text-brand-foreground md:text-4xl">
            Why verified engineers are different
          </h2>
        </div>

        {/* Pillar cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="rounded-xl border border-brand-border bg-white p-6"
              >
                {/* Icon wrapper */}
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-xl font-semibold tracking-tight text-brand-foreground">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="mb-4 text-sm leading-relaxed text-brand-foreground-muted">
                  {pillar.description}
                </p>

                {/* Tagline */}
                <p className="text-sm font-semibold italic text-brand-primary">
                  {pillar.tagline}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

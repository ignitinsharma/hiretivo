import { ShieldCheck, DollarSign, BadgeCheck } from 'lucide-react'
import Link from 'next/link'

/*
 * WhyVerifiedSection
 * Light-surface section with split header layout (headline left, paragraph right)
 * and 3 premium white cards on gray background.
 * Fully static — no props.
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

/*
 * WhyVerifiedSection
 * Renders the "Why Verified" trust section with split header and pillar cards.
 * @returns JSX section element — fully static
 */
export function WhyVerifiedSection() {
  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Split header */}
        <div className="mb-12 grid grid-cols-1 items-end gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              The Hiretivo Standard
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-foreground md:text-4xl">
              Why verified engineers<br className="hidden lg:block" /> are different
            </h2>
          </div>
          <div>
            <p className="text-base leading-relaxed text-brand-foreground-muted">
              Most job platforms show everyone who bothered to sign up.
              We manually review every profile — GitHub activity, real project depth,
              communication quality. Fewer engineers, sharply higher signal.
            </p>
            <Link
              href="/seeker/verification"
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand-primary hover:underline"
            >
              See how we verify →
            </Link>
          </div>
        </div>

        {/* Pillar cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-brand-border bg-white p-6"
              >
                {/* Icon */}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-base font-bold tracking-tight text-brand-foreground">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="mb-4 text-sm leading-relaxed text-brand-foreground-muted">
                  {pillar.description}
                </p>

                {/* Tagline */}
                <p className="text-sm font-bold italic text-brand-primary">
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

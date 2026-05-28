/*
 * HeroRecruiterSection
 * White minimal hero for the Hiretivo homepage. Two-column layout:
 * Left: badge, headline, subtext, primary CTA, inline quality stats.
 * Right: 3 engineer preview cards — first fully visible, rest blurred.
 * Server component — no client state, no interactive handlers.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_ENGINEER_CARDS, HOMEPAGE_STATS } from '@/config/home-page'
import { EngineerPreviewCard } from '@/components/home/EngineerPreviewCard'

/*
 * HeroRecruiterSection
 * Renders the full-width white hero section on the Hiretivo homepage.
 * No props — all content sourced from config constants.
 */
export function HeroRecruiterSection() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_400px]">

        {/* ── LEFT: copy ── */}
        <div>
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden="true" />
            <span className="text-xs font-semibold text-brand-foreground-muted">
              500+ verified Indian engineers
            </span>
          </div>

          {/* H1 */}
          <h1 className="mb-5 text-5xl font-bold leading-[1.0] tracking-[-2.5px] text-brand-foreground md:text-[60px]">
            Engineers you<br />
            can{' '}
            <span className="text-brand-primary">trust.</span>
          </h1>

          {/* Subtext */}
          <p className="mb-8 max-w-[420px] text-base leading-[1.7] text-brand-foreground-muted">
            Every engineer is manually reviewed, GitHub-scored, and
            salary-transparent before you ever see them.
            Browse the verified talent pool. Unlock in one click.
          </p>

          {/* Primary CTA */}
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/recruiter/register">
                Browse Talent Pool
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-brand-foreground-muted">
              Are you an engineer?{' '}
              <Link
                href="/seeker/verification"
                className="font-semibold text-brand-primary hover:underline"
              >
                Get verified free →
              </Link>
            </p>
          </div>

          {/* Inline stats */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-brand-border pt-7">
            {HOMEPAGE_STATS.map((stat) => (
              <div key={stat.label}>
                <span className="block text-2xl font-bold tracking-tight text-brand-foreground">
                  {stat.value}
                </span>
                <span className="text-[11px] font-medium text-brand-foreground-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: engineer preview cards ── */}
        <div className="flex flex-col gap-3">
          {MOCK_ENGINEER_CARDS.map((card, i) => (
            <div key={card.id} aria-hidden={i !== 0 || undefined}>
              <EngineerPreviewCard
                firstName={card.firstName}
                lastInitial={card.lastInitial}
                isVerified={card.isVerified}
                hiretivoScore={card.hiretivoScore}
                role={card.role}
                yearsExp={card.yearsExp}
                skills={card.skills}
                salaryMin={card.salaryMin}
                salaryMax={card.salaryMax}
                timezoneOverlapHours={card.timezoneOverlapHours}
                availableFrom={card.availableFrom}
                highlighted={i === 0}
                blurLevel={i === 0 ? 'none' : i === 1 ? 'medium' : 'heavy'}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

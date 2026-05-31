/*
 * HeroRecruiterSection
 * White minimal hero — two-column layout.
 * Left: badge, headline, subtext, CTA, inline quality stats.
 * Right: cascading overlapping engineer preview cards (absolute positioned stack).
 * Server component — no client state, no interactive handlers.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_ENGINEER_CARDS, HOMEPAGE_STATS } from '@/config/home-page'
import { EngineerPreviewCard } from '@/components/home/EngineerPreviewCard'

/*
 * HeroRecruiterSection
 * Renders the full-width white hero with left copy and right cascading card stack.
 * No props — all content from config constants.
 */
export function HeroRecruiterSection() {
  return (
    <section className="dot-grid relative overflow-hidden bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_440px]">

        {/* ── LEFT: copy ── */}
        <div>
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-1.5">
            <span className="text-xs font-bold text-brand-primary" aria-hidden="true">✓</span>
            <span className="text-xs font-semibold text-brand-foreground-muted">
              500+ Verified Indian Engineers
            </span>
          </div>

          {/* H1 */}
          <h1 className="mb-5 font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-brand-foreground md:text-[60px]">
            Hire engineers<br />
            you can{' '}
            <span className="italic text-brand-primary">trust.</span>
          </h1>

          {/* Subtext */}
          <p className="mb-8 max-w-[420px] text-base leading-[1.7] text-brand-foreground-muted">
            Every engineer is manually reviewed, GitHub-scored,
            and salary-transparent before you see them.
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
                <span className="block font-display text-2xl font-bold tracking-[-0.02em] text-brand-foreground">
                  {stat.value}
                </span>
                <span className="font-body text-[11px] font-medium text-brand-foreground-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: cascading card stack ── */}
        <div className="hidden lg:block">
          {/* Soft purple glow behind the stack */}
          <div
            className="relative h-[480px]"
            aria-hidden="true"
          >
            {/* Background gradient blob */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-primary/[0.07] via-brand-primary/[0.04] to-transparent" />

            {/* Card 1 — top, fully visible, slight right offset */}
            <div className="absolute left-4 right-0 top-0 z-30">
              <EngineerPreviewCard
                firstName={MOCK_ENGINEER_CARDS[0].firstName}
                lastInitial={MOCK_ENGINEER_CARDS[0].lastInitial}
                isVerified={MOCK_ENGINEER_CARDS[0].isVerified}
                hiretivoScore={MOCK_ENGINEER_CARDS[0].hiretivoScore}
                role={MOCK_ENGINEER_CARDS[0].role}
                yearsExp={MOCK_ENGINEER_CARDS[0].yearsExp}
                skills={MOCK_ENGINEER_CARDS[0].skills}
                salaryMin={MOCK_ENGINEER_CARDS[0].salaryMin}
                salaryMax={MOCK_ENGINEER_CARDS[0].salaryMax}
                timezoneOverlapHours={5}
                availableFrom={MOCK_ENGINEER_CARDS[0].availableFrom}
                highlighted
                blurLevel="none"
              />
            </div>

            {/* Card 2 — offset down, blurred, slight left offset */}
            <div className="absolute left-0 right-4 top-[188px] z-20">
              <EngineerPreviewCard
                firstName={MOCK_ENGINEER_CARDS[1].firstName}
                lastInitial={MOCK_ENGINEER_CARDS[1].lastInitial}
                isVerified={MOCK_ENGINEER_CARDS[1].isVerified}
                hiretivoScore={MOCK_ENGINEER_CARDS[1].hiretivoScore}
                role={MOCK_ENGINEER_CARDS[1].role}
                yearsExp={MOCK_ENGINEER_CARDS[1].yearsExp}
                skills={MOCK_ENGINEER_CARDS[1].skills}
                salaryMin={MOCK_ENGINEER_CARDS[1].salaryMin}
                salaryMax={MOCK_ENGINEER_CARDS[1].salaryMax}
                timezoneOverlapHours={5}
                availableFrom={MOCK_ENGINEER_CARDS[1].availableFrom}
                highlighted={false}
                blurLevel="medium"
              />
            </div>

            {/* Card 3 — bottom, heavily blurred */}
            <div className="absolute left-6 right-2 top-[340px] z-10">
              <EngineerPreviewCard
                firstName={MOCK_ENGINEER_CARDS[2].firstName}
                lastInitial={MOCK_ENGINEER_CARDS[2].lastInitial}
                isVerified={MOCK_ENGINEER_CARDS[2].isVerified}
                hiretivoScore={MOCK_ENGINEER_CARDS[2].hiretivoScore}
                role={MOCK_ENGINEER_CARDS[2].role}
                yearsExp={MOCK_ENGINEER_CARDS[2].yearsExp}
                skills={MOCK_ENGINEER_CARDS[2].skills}
                salaryMin={MOCK_ENGINEER_CARDS[2].salaryMin}
                salaryMax={MOCK_ENGINEER_CARDS[2].salaryMax}
                timezoneOverlapHours={4}
                availableFrom={MOCK_ENGINEER_CARDS[2].availableFrom}
                highlighted={false}
                blurLevel="heavy"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

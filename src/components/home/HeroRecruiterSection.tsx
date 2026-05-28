/*
 * HeroRecruiterSection
 * Recruiter-first homepage hero — two-column layout.
 * Left column: headline copy, subtext, primary CTA (Browse Talent Pool),
 *              and a secondary link for engineers to get verified.
 * Right column: three blurred mock EngineerPreviewCard instances sourced
 *               from MOCK_ENGINEER_CARDS to tease the verified talent pool.
 *
 * Server component — no client state, no interactive handlers.
 * Data: static MOCK_ENGINEER_CARDS from src/config/home-page.ts (no DB call).
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_ENGINEER_CARDS } from '@/config/home-page'
import { EngineerPreviewCard } from '@/components/home/EngineerPreviewCard'

/*
 * HeroRecruiterSection
 * Renders the full-width pivot hero section on the Hiretivo homepage.
 * No props — all content is static / derived from config constants.
 * @returns JSX section element with copy left + engineer cards right.
 */
export function HeroRecruiterSection() {
  return (
    <section className="grid-bg overflow-hidden border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1fr]">

        {/* ── LEFT: copy ── */}
        <div>
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm font-semibold text-brand-foreground">
            ✦ 500+ verified Indian engineers
          </div>

          {/* H1 */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl lg:text-6xl">
            Hire engineers<br />
            <span className="italic">you can trust.</span>
          </h1>

          {/* Subtext */}
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-brand-foreground-muted">
            Every engineer is manually reviewed, GitHub-scored, and salary-transparent
            before you ever see them. Browse the verified talent pool. Unlock in one click.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/recruiter/register">
                Browse Talent Pool
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Engineer secondary link */}
          <p className="mt-4 text-sm text-brand-foreground-muted">
            Are you an engineer?{' '}
            <Link
              href="/seeker/verification"
              className="font-semibold text-brand-primary hover:underline"
            >
              Get verified free →
            </Link>
          </p>
        </div>

        {/* ── RIGHT: engineer preview cards ── */}
        <div className="flex flex-col gap-4">
          {MOCK_ENGINEER_CARDS.map((card) => (
            <EngineerPreviewCard
              key={card.id}
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
            />
          ))}
        </div>

      </div>
    </section>
  )
}
